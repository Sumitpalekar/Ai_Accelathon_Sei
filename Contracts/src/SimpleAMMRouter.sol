// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20Like.sol";

contract SimpleAMMRouter {
    struct Pair {
        uint112 reserve0;
        uint112 reserve1;
        address token0;
        address token1;
        bool    exists;
    }

    uint256 public constant FEE_BPS = 30;      // 0.30% fee
    uint256 public constant BPS      = 10_000;

    // key = keccak256(min(tokenA,tokenB), max(tokenA,tokenB))
    mapping(bytes32 => Pair) public pairs;

    event PairCreated(address indexed token0, address indexed token1);
    event LiquidityAdded(address indexed provider, address indexed token0, address indexed token1, uint256 amt0, uint256 amt1);
    event LiquidityRemoved(address indexed provider, address indexed token0, address indexed token1, uint256 amt0, uint256 amt1);
    event Swap(address indexed trader, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    error PairNotFound();
    error InvalidAmounts();
    error TransferFailed();

    function _key(address a, address b) internal pure returns (bytes32, address, address) {
        require(a != b, "same token");
        (address t0, address t1) = a < b ? (a,b) : (b,a);
        return (keccak256(abi.encodePacked(t0, t1)), t0, t1);
    }

    function createPair(address a, address b) external {
        (bytes32 k, address t0, address t1) = _key(a,b);
        Pair storage p = pairs[k];
        require(!p.exists, "exists");
        p.token0 = t0; p.token1 = t1; p.exists = true;
        emit PairCreated(t0, t1);
    }

    function addLiquidity(address a, address b, uint256 amtA, uint256 amtB) external {
        (bytes32 k, address t0, address t1) = _key(a,b);
        Pair storage p = pairs[k];
        if (!p.exists) { p.token0 = t0; p.token1 = t1; p.exists = true; emit PairCreated(t0, t1); }
        require(amtA > 0 && amtB > 0, "zero liq");

        // pull tokens
        require(IERC20Like(a).transferFrom(msg.sender, address(this), amtA), "pull A");
        require(IERC20Like(b).transferFrom(msg.sender, address(this), amtB), "pull B");

        if (a == p.token0) {
            p.reserve0 = uint112(uint256(p.reserve0) + amtA);
            p.reserve1 = uint112(uint256(p.reserve1) + amtB);
        } else {
            p.reserve0 = uint112(uint256(p.reserve0) + amtB);
            p.reserve1 = uint112(uint256(p.reserve1) + amtA);
        }

        emit LiquidityAdded(msg.sender, p.token0, p.token1, amtA, amtB);
    }

    // simplistic: removes proportionally by amounts requested (up to reserves)
    function removeLiquidity(address a, address b, uint256 amtA, uint256 amtB) external {
        (bytes32 k, , ) = _key(a,b);
        Pair storage p = pairs[k];
        if (!p.exists) revert PairNotFound();
        require(amtA > 0 && amtB > 0, "zero out");
        // reduce reserves
        if (a == p.token0) {
            require(p.reserve0 >= amtA && p.reserve1 >= amtB, "reserves");
            p.reserve0 -= uint112(amtA);
            p.reserve1 -= uint112(amtB);
        } else {
            require(p.reserve0 >= amtB && p.reserve1 >= amtA, "reserves");
            p.reserve0 -= uint112(amtB);
            p.reserve1 -= uint112(amtA);
        }
        // send back
        require(IERC20Like(a).transfer(msg.sender, amtA), "send A");
        require(IERC20Like(b).transfer(msg.sender, amtB), "send B");
        emit LiquidityRemoved(msg.sender, p.token0, p.token1, amtA, amtB);
    }

    // amountOut with 0.3% fee
    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256) {
        (bytes32 k, , ) = _key(tokenIn, tokenOut);
        Pair storage p = pairs[k];
        if (!p.exists) revert PairNotFound();

        (uint256 rIn, uint256 rOut) = tokenIn == p.token0
            ? (uint256(p.reserve0), uint256(p.reserve1))
            : (uint256(p.reserve1), uint256(p.reserve0));

        uint256 amountInWithFee = amountIn * (BPS - FEE_BPS) / BPS;
        // x*y = k; out = (amountInWithFee * rOut) / (rIn + amountInWithFee)
        return (amountInWithFee * rOut) / (rIn + amountInWithFee);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address to
    ) external returns (uint256 amountOut) {
        (bytes32 k, , ) = _key(tokenIn, tokenOut);
        Pair storage p = pairs[k];
        if (!p.exists) revert PairNotFound();
        require(amountIn > 0, "zero in");

        // pull tokenIn
        require(IERC20Like(tokenIn).transferFrom(msg.sender, address(this), amountIn), "pull in");

        // compute out
        amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        require(amountOut >= amountOutMin, "slippage");

        // update reserves and send out
        if (tokenIn == p.token0) {
            p.reserve0 = uint112(uint256(p.reserve0) + amountIn);
            require(p.reserve1 >= amountOut, "reserve out");
            p.reserve1 -= uint112(amountOut);
        } else {
            p.reserve1 = uint112(uint256(p.reserve1) + amountIn);
            require(p.reserve0 >= amountOut, "reserve out");
            p.reserve0 -= uint112(amountOut);
        }

        require(IERC20Like(tokenOut).transfer(to, amountOut), "send out");
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    // Simple on-chain price view: price of tokenIn in terms of tokenOut (spot)
    function getPrice(address tokenIn, address tokenOut, uint256 unit) external view returns (uint256) {
        // returns how much tokenOut you get for `unit` tokenIn
        return getAmountOut(tokenIn, tokenOut, unit);
    }
}

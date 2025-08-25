// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20Like.sol";
import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";

contract UniswapV2Router02 {
    address public immutable factory;

    event SwapExecuted(
        address user,
        address tokenIn,
        address tokenOut,
        uint amountIn,
        uint amountOut
    );

    event LiquidityAdded(
        address tokenA,
        address tokenB,
        uint amountA,
        uint amountB,
        address provider
    );

    constructor(address _factory) {
        factory = _factory;
    }

    // -------------------------
    // Add Liquidity
    // -------------------------
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        require(block.timestamp <= deadline, "UniswapV2Router: EXPIRED");

        // Find or create pair
        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = IUniswapV2Factory(factory).createPair(tokenA, tokenB);
        }

        // Transfer tokens from user to pair
        bool successA = IERC20Like(tokenA).transferFrom(msg.sender, pair, amountADesired);
        bool successB = IERC20Like(tokenB).transferFrom(msg.sender, pair, amountBDesired);
        require(successA && successB, "Token transfer failed");

        // ✅ Call pair's addLiquidity (no mint function in your pair)
        IUniswapV2Pair(pair).addLiquidity(amountADesired, amountBDesired);
        liquidity = 1; // dummy value, LP tokens not implemented

        // Return actual amounts used
        amountA = amountADesired;
        amountB = amountBDesired;

        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, to);
    }

    // -------------------------
    // Swap tokens
    // -------------------------
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to
    ) external returns (uint[] memory amounts) {
        require(path.length >= 2, "Invalid path");

        address input = path[0];
        address output = path[1];

        // find pair
        address pair = IUniswapV2Factory(factory).getPair(input, output);
        require(pair != address(0), "Pair does not exist");

        // transfer input token into pair
        IERC20Like(input).transferFrom(msg.sender, pair, amountIn);

        // get reserves to calculate output
        (uint112 reserve0, uint112 reserve1) = IUniswapV2Pair(pair).getReserves();
        (uint reserveInput, uint reserveOutput) = input == IUniswapV2Pair(pair).token0()
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        // simple constant product formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        uint amountOut = (amountIn * reserveOutput) / (reserveInput + amountIn);
        require(amountOut >= amountOutMin, "Insufficient output");

        // execute swap
        if (input == IUniswapV2Pair(pair).token0()) {
            IUniswapV2Pair(pair).swap(0, amountOut, to, new bytes(0));
        } else {
            IUniswapV2Pair(pair).swap(amountOut, 0, to, new bytes(0));
        }

        // return amounts
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        emit SwapExecuted(msg.sender, input, output, amountIn, amountOut);
    }
}

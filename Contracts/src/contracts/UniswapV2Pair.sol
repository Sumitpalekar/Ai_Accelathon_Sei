// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20Like.sol";

contract UniswapV2Pair {
    address public token0;
    address public token1;

    uint112 private reserve0;
    uint112 private reserve1;

    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );

    // Optional: emitted when liquidity is added so frontend can track
    event LiquidityAdded(address indexed provider, uint amount0, uint amount1);

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() public view returns (uint112, uint112) {
        return (reserve0, reserve1);
    }

    function _update(uint balance0, uint balance1) private {
        // clamp to uint112 to match storage type
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
    }

    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata /*data*/
    ) external {
        require(amount0Out > 0 || amount1Out > 0, "Invalid output");
        (uint112 _reserve0, uint112 _reserve1) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "Insufficient liquidity");

        if (amount0Out > 0) IERC20Like(token0).transfer(to, amount0Out);
        if (amount1Out > 0) IERC20Like(token1).transfer(to, amount1Out);

        uint balance0 = IERC20Like(token0).balanceOf(address(this));
        uint balance1 = IERC20Like(token1).balanceOf(address(this));

        _update(balance0, balance1);

        emit Swap(msg.sender, 0, 0, amount0Out, amount1Out, to);
    }

    /**
     * @notice Add liquidity **after** tokens have been sent to this pair.
     * The router should transfer tokens from the provider -> this pair, then call this.
     * This function does NOT call transferFrom (router already moved funds).
     *
     * @param amount0 Amount of token0 intended to add (informational)
     * @param amount1 Amount of token1 intended to add (informational)
     */
    function addLiquidity(uint amount0, uint amount1) external {
        // At this point, the router should have already transferred the tokens to this contract.
        // Read current balances and update reserves accordingly.
        uint balance0 = IERC20Like(token0).balanceOf(address(this));
        uint balance1 = IERC20Like(token1).balanceOf(address(this));

        // Optional: you can check that the increase in balances is >= amounts passed for sanity:
        // require(balance0 >= reserve0 + amount0 && balance1 >= reserve1 + amount1, "Insufficient transferred amounts");

        _update(balance0, balance1);

        emit LiquidityAdded(msg.sender, amount0, amount1);
    }
}

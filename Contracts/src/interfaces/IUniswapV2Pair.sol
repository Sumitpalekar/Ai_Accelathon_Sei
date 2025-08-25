// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112, uint112);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function addLiquidity(uint amount0, uint amount1) external;
    function mint(address to) external returns (uint liquidity);
}

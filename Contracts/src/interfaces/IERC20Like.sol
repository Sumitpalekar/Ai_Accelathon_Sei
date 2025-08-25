// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Like {
    function totalSupply() external view returns (uint256);
    function balanceOf(address a) external view returns (uint256);
    function allowance(address a, address b) external view returns (uint256);

    function transfer(address to, uint256 amt) external returns (bool);
    function approve(address sp, uint256 amt) external returns (bool);
    function transferFrom(address from, address to, uint256 amt) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
}

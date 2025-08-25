// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721Like {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 id) external view returns (address);
    function tokenURI(uint256 id) external view returns (string memory);

    function approve(address to, uint256 id) external;
    function getApproved(uint256 id) external view returns (address);
    function setApprovalForAll(address op, bool approved) external;
    function isApprovedForAll(address owner, address op) external view returns (bool);

    function transferFrom(address from, address to, uint256 id) external;
    function safeTransferFrom(address from, address to, uint256 id) external;

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed to, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed op, bool approved);
}

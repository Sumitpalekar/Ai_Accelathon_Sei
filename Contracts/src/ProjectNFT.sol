// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProjectNFT {
    string public name = "Project NFT";
    string public symbol = "PNFT";

    address public owner;
    uint256 private _id;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _approval;
    mapping(address => mapping(address => bool)) private _op;
    mapping(uint256 => string) private _uri;

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed to, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed op, bool approved);
    event Minted(address indexed to, uint256 indexed id, string uri);
    event Burned(uint256 indexed id);

    modifier onlyOwner() { require(msg.sender == owner, "Only owner"); _; }
    modifier exists(uint256 id_) { require(_owners[id_] != address(0), "No token"); _; }

    constructor() { owner = msg.sender; }

    function balanceOf(address a) external view returns (uint256) { require(a != address(0), "Zero"); return _balances[a]; }
    function ownerOf(uint256 id_) public view exists(id_) returns (address) { return _owners[id_]; }
    function tokenURI(uint256 id_) external view exists(id_) returns (string memory) { return _uri[id_]; }

    function approve(address to, uint256 id_) external exists(id_) {
        address o = _owners[id_];
        require(msg.sender == o || _op[o][msg.sender], "Not auth");
        _approval[id_] = to;
        emit Approval(o, to, id_);
    }
    function getApproved(uint256 id_) external view exists(id_) returns (address) { return _approval[id_]; }
    function setApprovalForAll(address op, bool ok) external { _op[msg.sender][op] = ok; emit ApprovalForAll(msg.sender, op, ok); }
    function isApprovedForAll(address o, address op_) external view returns (bool) { return _op[o][op_]; }

    function transferFrom(address from, address to, uint256 id_) public exists(id_) {
        address o = _owners[id_];
        require(msg.sender == o || _approval[id_] == msg.sender || _op[o][msg.sender], "Not auth");
        require(o == from, "From mismatch");
        require(to != address(0), "Zero");
        _approval[id_] = address(0);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[id_] = to;
        emit Transfer(from, to, id_);
    }
    function safeTransferFrom(address from, address to, uint256 id_) external { transferFrom(from, to, id_); }

    function mint(address to, string calldata uri_) external onlyOwner returns (uint256) {
        require(to != address(0), "Zero");
        uint256 newId = ++_id;
        _owners[newId] = to;
        _balances[to] += 1;
        _uri[newId] = uri_;
        emit Transfer(address(0), to, newId);
        emit Minted(to, newId, uri_);
        return newId;
    }

    function burn(uint256 id_) external exists(id_) {
        address o = _owners[id_];
        require(msg.sender == o || _op[o][msg.sender], "Not auth");
        _approval[id_] = address(0);
        _balances[o] -= 1;
        delete _owners[id_];
        delete _uri[id_];
        emit Transfer(o, address(0), id_);
        emit Burned(id_);
    }
}

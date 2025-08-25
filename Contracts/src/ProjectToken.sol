// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProjectToken {
    string public name;
    string public symbol;
    uint8  public constant decimals = 18;

    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event OwnershipTransferred(address indexed prev, address indexed next);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(string memory _name, string memory _symbol, uint256 initialSupply) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        _mint(msg.sender, initialSupply);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transfer(address to, uint256 amt) external returns (bool) {
        _transfer(msg.sender, to, amt);
        return true;
    }

    function approve(address sp, uint256 amt) external returns (bool) {
        allowance[msg.sender][sp] = amt;
        emit Approval(msg.sender, sp, amt);
        return true;
    }

    function transferFrom(address from, address to, uint256 amt) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        require(a >= amt, "Allowance");
        if (a != type(uint256).max) allowance[from][msg.sender] = a - amt;
        _transfer(from, to, amt);
        return true;
    }

    function mint(address to, uint256 amt) external onlyOwner { _mint(to, amt); }

    function burn(uint256 amt) external {
        require(balanceOf[msg.sender] >= amt, "Balance");
        balanceOf[msg.sender] -= amt;
        totalSupply -= amt;
        emit Burn(msg.sender, amt);
        emit Transfer(msg.sender, address(0), amt);
    }

    function transferOwnership(address n) external onlyOwner {
        require(n != address(0), "Zero");
        emit OwnershipTransferred(owner, n);
        owner = n;
    }

    function _mint(address to, uint256 amt) internal {
        require(to != address(0), "Zero");
        totalSupply += amt;
        balanceOf[to] += amt;
        emit Mint(to, amt);
        emit Transfer(address(0), to, amt);
    }

    function _transfer(address from, address to, uint256 amt) internal {
        require(to != address(0), "Zero");
        require(balanceOf[from] >= amt, "Balance");
        balanceOf[from] -= amt;
        balanceOf[to] += amt;
        emit Transfer(from, to, amt);
    }
}

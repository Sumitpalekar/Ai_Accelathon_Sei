// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20Like.sol";

contract PredictionMarket {
    struct Market {
        string question;
        uint256 options;       // >= 2
        uint256 closeTime;     // unix time
        bool resolved;
        uint256 winningOption; // 1..options
        uint256 totalStaked;
        address creator;
        bool active;
    }

    IERC20Like public immutable stakeToken;
    uint256 public marketCount;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(uint256 => uint256)) public optionStake;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public userOptionStake;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event MarketCreated(uint256 indexed id, string question, uint256 options, uint256 closeTime, address indexed creator);
    event BetPlaced(uint256 indexed id, address indexed user, uint256 option, uint256 amount);
    event MarketResolved(uint256 indexed id, uint256 winningOption);
    event Claimed(uint256 indexed id, address indexed user, uint256 payout);
    event MarketActive(uint256 indexed id, bool active);

    error InvalidParams();
    error MarketClosed();
    error AlreadyResolved();
    error NotResolved();
    error NotActive();
    error AlreadyClaimed();
    error NoWinnings();

    constructor(address _stakeToken) {
        require(_stakeToken != address(0), "Zero token");
        stakeToken = IERC20Like(_stakeToken);
    }

    function createMarket(string calldata q, uint256 opts, uint256 closeT) external returns (uint256 id) {
        if (opts < 2 || closeT <= block.timestamp) revert InvalidParams();
        id = ++marketCount;
        markets[id] = Market(q, opts, closeT, false, 0, 0, msg.sender, true);
        emit MarketCreated(id, q, opts, closeT, msg.sender);
    }

    function bet(uint256 id, uint256 opt, uint256 amt) external {
        Market storage m = markets[id];
        if (!m.active) revert NotActive();
        if (block.timestamp >= m.closeTime) revert MarketClosed();
        if (opt == 0 || opt > m.options) revert InvalidParams();
        require(amt > 0, "Zero amt");

        require(stakeToken.transferFrom(msg.sender, address(this), amt), "transferFrom");
        optionStake[id][opt] += amt;
        userOptionStake[id][msg.sender][opt] += amt;
        m.totalStaked += amt;

        emit BetPlaced(id, msg.sender, opt, amt);
    }

    function resolve(uint256 id, uint256 winner) external {
        Market storage m = markets[id];
        if (!m.active) revert NotActive();
        if (m.resolved) revert AlreadyResolved();
        if (block.timestamp < m.closeTime) revert MarketClosed();
        if (winner == 0 || winner > m.options) revert InvalidParams();

        m.resolved = true;
        m.winningOption = winner;
        emit MarketResolved(id, winner);
    }

    function claim(uint256 id) external {
        Market storage m = markets[id];
        if (!m.resolved) revert NotResolved();
        if (claimed[id][msg.sender]) revert AlreadyClaimed();

        uint256 win = userOptionStake[id][msg.sender][m.winningOption];
        if (win == 0) revert NoWinnings();

        uint256 totalWin = optionStake[id][m.winningOption];
        uint256 payout = (m.totalStaked * win) / totalWin;

        claimed[id][msg.sender] = true;
        require(stakeToken.transfer(msg.sender, payout), "payout");
        emit Claimed(id, msg.sender, payout);
    }

    function setActive(uint256 id, bool on) external {
        markets[id].active = on;
        emit MarketActive(id, on);
    }
}

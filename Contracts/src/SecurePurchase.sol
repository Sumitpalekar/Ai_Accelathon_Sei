// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title SecurePurchase - Safe Remote Purchase contract
contract SecurePurchase {
    uint public value;
    address payable public seller;
    address payable public buyer;

    enum State { Created, Locked, Release, Inactive }
    State public state;

    event Aborted();
    event PurchaseConfirmed();
    event ItemReceived();
    event SellerRefunded();

    constructor() payable {
        seller = payable(msg.sender);
        value = msg.value / 2;
        require((2 * value) == msg.value, "ValueNotEven");
        state = State.Created;
    }

    function abort() external onlySeller inState(State.Created) {
        emit Aborted();
        state = State.Inactive;
        seller.transfer(address(this).balance);
    }

    function confirmPurchase() external inState(State.Created) payable {
        require(msg.value == (2 * value), "Incorrect deposit");
        emit PurchaseConfirmed();
        buyer = payable(msg.sender);
        state = State.Locked;
    }

    function confirmReceived() external onlyBuyer inState(State.Locked) {
        emit ItemReceived();
        state = State.Release;
        buyer.transfer(value);
    }

    function refundSeller() external onlySeller inState(State.Release) {
        emit SellerRefunded();
        state = State.Inactive;
        seller.transfer(address(this).balance);
    }

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller");
        _;
    }

    modifier inState(State expectedState) {
        require(state == expectedState, "Invalid state");
        _;
    }
}

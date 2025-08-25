// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20Like.sol";
import "./interfaces/IERC721Like.sol";

contract Marketplace {
    struct Listing {
        address nft;
        uint256 tokenId;
        address seller;
        address paymentToken; // 0 = native
        uint256 price;
        bool active;
    }

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;

    address public feeRecipient;
    uint96  public feeBps; // e.g., 250 = 2.5%

    event Listed(uint256 indexed id, address indexed seller, address indexed nft, uint256 tokenId, address paymentToken, uint256 price);
    event PriceUpdated(uint256 indexed id, uint256 newPrice);
    event Canceled(uint256 indexed id);
    event Bought(uint256 indexed id, address indexed buyer, uint256 price, address paymentToken);
    event FeeParamsUpdated(address indexed recipient, uint96 feeBps);

    error NotSeller();
    error NotActive();
    error InvalidPrice();
    error InvalidNFT();
    error WrongValue();
    error TransferFailed();

    constructor(address _feeRecipient, uint96 _feeBps) {
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
        emit FeeParamsUpdated(_feeRecipient, _feeBps);
    }

    function list(address nft, uint256 tokenId, address paymentToken, uint256 price) external returns (uint256 id) {
        if (nft == address(0)) revert InvalidNFT();
        if (price == 0) revert InvalidPrice();
        IERC721Like(nft).safeTransferFrom(msg.sender, address(this), tokenId);
        id = ++listingCount;
        listings[id] = Listing(nft, tokenId, msg.sender, paymentToken, price, true);
        emit Listed(id, msg.sender, nft, tokenId, paymentToken, price);
    }

    function updatePrice(uint256 id, uint256 newPrice) external {
        Listing storage L = listings[id];
        if (!L.active) revert NotActive();
        if (msg.sender != L.seller) revert NotSeller();
        if (newPrice == 0) revert InvalidPrice();
        L.price = newPrice;
        emit PriceUpdated(id, newPrice);
    }

    function cancel(uint256 id) external {
        Listing storage L = listings[id];
        if (!L.active) revert NotActive();
        if (msg.sender != L.seller) revert NotSeller();
        L.active = false;
        IERC721Like(L.nft).safeTransferFrom(address(this), L.seller, L.tokenId);
        emit Canceled(id);
    }

    function buy(uint256 id) external payable {
        Listing storage L = listings[id];
        if (!L.active) revert NotActive();
        L.active = false;

        uint256 fee = (L.price * feeBps) / 10_000;
        uint256 sellerAmt = L.price - fee;

        if (L.paymentToken == address(0)) {
            if (msg.value != L.price) revert WrongValue();
            (bool ok1, ) = feeRecipient.call{value: fee}("");
            (bool ok2, ) = L.seller.call{value: sellerAmt}("");
            if (!ok1 || !ok2) revert TransferFailed();
        } else {
            IERC20Like t = IERC20Like(L.paymentToken);
            require(t.transferFrom(msg.sender, feeRecipient, fee), "fee xfer");
            require(t.transferFrom(msg.sender, L.seller, sellerAmt), "seller xfer");
        }

        IERC721Like(L.nft).safeTransferFrom(address(this), msg.sender, L.tokenId);
        emit Bought(id, msg.sender, L.price, L.paymentToken);
    }

    function setFeeParams(address r, uint96 bps) external {
        feeRecipient = r;
        feeBps = bps;
        emit FeeParamsUpdated(r, bps);
    }

    receive() external payable {}
}

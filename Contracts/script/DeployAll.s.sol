// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

// === App contracts ===
import "../src/ProjectToken.sol";
import "../src/ProjectNFT.sol";
import "../src/Marketplace.sol";
import "../src/PredictionMarket.sol";

// === DEX contracts ===
import "../src/contracts/UniswapV2Factory.sol";
import "../src/contracts/UniswapV2Router02.sol";

contract DeployAllInOne is Script {
    function run() external {
        // -------- ENV --------
        uint256 pk = vm.envUint("PRIVATE_KEY");

        string memory nameA = _envStringOr("TOKEN_A_NAME", "ProjectToken");
        string memory symA  = _envStringOr("TOKEN_A_SYMBOL", "PTK");
        uint256 supplyA     = _envUintOr("TOKEN_A_SUPPLY", 1_000_000 ether);

        string memory nameB = _envStringOr("TOKEN_B_NAME", "USD Test");
        string memory symB  = _envStringOr("TOKEN_B_SYMBOL", "USDT");
        uint256 supplyB     = _envUintOr("TOKEN_B_SUPPLY", 1_000_000 ether);

        address feeRecipient = _envAddressOr("FEE_RECIPIENT", vm.addr(pk));
        uint96 feeBps        = uint96(_envUintOr("MARKETPLACE_FEE_BPS", 200));

        uint256 liqA = _envUintOr("LIQ_TOKEN_A", 10_000 ether);
        uint256 liqB = _envUintOr("LIQ_TOKEN_B", 10_000 ether);

        vm.startBroadcast(pk);
        address deployer = vm.addr(pk);

        // -------- 1) Core app contracts --------
        ProjectToken tokenA = new ProjectToken(nameA, symA, supplyA);
        ProjectToken tokenB = new ProjectToken(nameB, symB, supplyB);
        ProjectNFT nft      = new ProjectNFT();
        Marketplace market  = new Marketplace(feeRecipient, feeBps);
        PredictionMarket pm = new PredictionMarket(address(tokenA));

        // -------- 2) DEX: Factory + Router --------
        UniswapV2Factory factory = new UniswapV2Factory(deployer);
        UniswapV2Router02 router = new UniswapV2Router02(address(factory));

        // -------- 3) Create pair & add liquidity --------
        address pair = factory.getPair(address(tokenA), address(tokenB));
        if (pair == address(0) || pair == address(0x1)) {
            factory.createPair(address(tokenA), address(tokenB));
            pair = factory.getPair(address(tokenA), address(tokenB));
        }
        require(pair != address(0) && pair != address(0x1), "Pair creation failed");

        // Clamp liquidity to balances
        uint256 balA = tokenA.balanceOf(deployer);
        uint256 balB = tokenB.balanceOf(deployer);
        if (liqA > balA) liqA = balA;
        if (liqB > balB) liqB = balB;

        // Approve router
        tokenA.approve(address(router), liqA);
        tokenB.approve(address(router), liqB);

        // Add liquidity
        uint256 deadline = block.timestamp + 3600; // 1 hour expiry
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            liqA,
            liqB,
            0,
            0,
            deployer,
            deadline
        );

        vm.stopBroadcast();

        // -------- Logs --------
        console2.log("== Deployment Complete ==");
        console2.log("Deployer                :", deployer);
        console2.log("ProjectToken A          :", address(tokenA));
        console2.log("ProjectToken B          :", address(tokenB));
        console2.log("ProjectNFT              :", address(nft));
        console2.log("Marketplace             :", address(market));
        console2.log("PredictionMarket        :", address(pm));
        console2.log("UniswapV2Factory        :", address(factory));
        console2.log("UniswapV2Router02       :", address(router));
        console2.log("Pair (A-B)              :", pair);
        console2.log("Seeded Liquidity A (wei):", liqA);
        console2.log("Seeded Liquidity B (wei):", liqB);
    }

    // ---------- Helpers: tolerant env readers ----------
    function _envStringOr(string memory key, string memory fallbackVal) internal view returns (string memory) {
        (bool ok, bytes memory data) = address(vm).staticcall(abi.encodeWithSignature("envString(string)", key));
        return ok ? abi.decode(data, (string)) : fallbackVal;
    }

    function _envUintOr(string memory key, uint256 fallbackVal) internal view returns (uint256) {
        (bool ok, bytes memory data) = address(vm).staticcall(abi.encodeWithSignature("envUint(string)", key));
        return ok ? abi.decode(data, (uint256)) : fallbackVal;
    }

    function _envAddressOr(string memory key, address fallbackVal) internal view returns (address) {
        (bool ok, bytes memory data) = address(vm).staticcall(abi.encodeWithSignature("envAddress(string)", key));
        return ok ? abi.decode(data, (address)) : fallbackVal;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SafeVault.sol";

contract DeployScript is Script {
    // Mainnet addresses
    address constant LIDO_MAINNET = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address constant STETH_MAINNET = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address constant ETH_PRICE_FEED_MAINNET = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    
    // Goerli addresses (for testing)
    address constant LIDO_GOERLI = 0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F;
    address constant STETH_GOERLI = 0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F;
    address constant ETH_PRICE_FEED_GOERLI = 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e;
    
    // Sepolia addresses (for testing)
    address constant LIDO_SEPOLIA = 0x0000000000000000000000000000000000000000; // Update with actual address
    address constant STETH_SEPOLIA = 0x0000000000000000000000000000000000000000; // Update with actual address
    address constant ETH_PRICE_FEED_SEPOLIA = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

    function run() external {
        // Use test private key for local development
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying SafeVault with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Choose network-specific addresses
        address lido;
        address stETH;
        address ethPriceFeed;
        
        if (block.chainid == 1) {
            // Mainnet
            lido = LIDO_MAINNET;
            stETH = STETH_MAINNET;
            ethPriceFeed = ETH_PRICE_FEED_MAINNET;
            console.log("Deploying to MAINNET");
        } else if (block.chainid == 5) {
            // Goerli
            lido = LIDO_GOERLI;
            stETH = STETH_GOERLI;
            ethPriceFeed = ETH_PRICE_FEED_GOERLI;
            console.log("Deploying to GOERLI");
        } else if (block.chainid == 11155111) {
            // Sepolia
            lido = LIDO_SEPOLIA;
            stETH = STETH_SEPOLIA;
            ethPriceFeed = ETH_PRICE_FEED_SEPOLIA;
            console.log("Deploying to SEPOLIA");
        } else if (block.chainid == 31337) {
            // Local development (Anvil)
            // Use mock addresses for local testing
            lido = address(0x1234567890123456789012345678901234567890);
            stETH = address(0x1234567890123456789012345678901234567890);
            ethPriceFeed = address(0x1234567890123456789012345678901234567890);
            console.log("Deploying to LOCAL DEVELOPMENT");
        } else {
            revert("Unsupported network");
        }
        
        console.log("Lido address:", lido);
        console.log("stETH address:", stETH);
        console.log("ETH Price Feed address:", ethPriceFeed);
        
        // Deploy SafeVault
        SafeVault safeVault = new SafeVault(
            lido,
            stETH,
            ethPriceFeed
        );
        
        console.log("SafeVault deployed at:", address(safeVault));
        console.log("Owner:", safeVault.owner());
        console.log("Min deposit:", safeVault.minDeposit());
        console.log("Max deposit:", safeVault.maxDeposit());
        
        vm.stopBroadcast();
    }
}

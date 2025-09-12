// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SafeVault.sol";
import "../src/mocks/MockLido.sol";
import "../src/mocks/MockChainlinkOracle.sol";

contract DeployLocalScript is Script {
    function run() external {
        // Use test private key for local development
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to LOCAL DEVELOPMENT");
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mock contracts
        console.log("\n=== Deploying Mock Contracts ===");
        
        MockLido mockLido = new MockLido();
        console.log("MockLido deployed at:", address(mockLido));
        
        MockChainlinkOracle mockPriceFeed = new MockChainlinkOracle();
        console.log("MockChainlinkOracle deployed at:", address(mockPriceFeed));
        
        // Deploy SafeVault with mock contracts
        console.log("\n=== Deploying SafeVault ===");
        
        SafeVault safeVault = new SafeVault(
            address(mockLido), // lido
            address(mockLido), // stETH (same as lido in our mock)
            address(mockPriceFeed) // ethPriceFeed
        );
        
        console.log("SafeVault deployed at:", address(safeVault));
        console.log("Owner:", safeVault.owner());
        console.log("Min deposit:", safeVault.minDeposit());
        console.log("Max deposit:", safeVault.maxDeposit());
        
        // Send some ETH to the mock Lido contract for testing
        payable(address(mockLido)).transfer(100 ether);
        console.log("Sent 100 ETH to MockLido for testing");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("MockLido:", address(mockLido));
        console.log("MockChainlinkOracle:", address(mockPriceFeed));
        console.log("SafeVault:", address(safeVault));
        console.log("\nContracts deployed successfully!");
        console.log("Run 'node setup/update-contracts.js' to update frontend config automatically.");
    }
}

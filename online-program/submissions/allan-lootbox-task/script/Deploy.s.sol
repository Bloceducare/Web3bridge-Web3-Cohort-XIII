// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LootBox.sol";

/**
 * @title Deploy
 * @dev Deployment script for LootBox contract and supporting infrastructure
 */
contract Deploy is Script {
    // Network-specific VRF Coordinator addresses
    mapping(uint256 => address) public vrfCoordinators;
    mapping(uint256 => bytes32) public keyHashes;
    mapping(uint256 => uint64) public subscriptionIds;

    function setUp() public {
        // Ethereum Sepolia
        vrfCoordinators[11155111] = 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625;
        keyHashes[11155111] = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
        subscriptionIds[11155111] = 0; // Set your subscription ID

        // Polygon Mainnet
        vrfCoordinators[137] = 0xAE975071Be8F8eE67addBC1A82488F1C24858067;
        keyHashes[137] = 0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93;
        subscriptionIds[137] = 0; // Set your subscription ID
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;

        console.log("Deploying LootBox on chain ID:", chainId);
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        address vrfCoordinator;
        bytes32 keyHash;
        uint64 subscriptionId;

        // Use real VRF coordinator for known networks, or set defaults for local testing
        if (vrfCoordinators[chainId] != address(0)) {
            vrfCoordinator = vrfCoordinators[chainId];
            keyHash = keyHashes[chainId];
            subscriptionId = subscriptionIds[chainId];
            console.log("Using real VRF coordinator:", vrfCoordinator);
        } else {
            // For local testing, you need to deploy a mock VRF coordinator first
            // or use the DeployMocks script
            revert("No VRF coordinator configured for this network. Use DeployMocks script for local testing.");
        }

        // Deploy LootBox contract
        LootBox lootBox = new LootBox(
            vrfCoordinator,
            keyHash,
            subscriptionId,
            500000, // callbackGasLimit
            3,      // requestConfirmations
            0.1 ether, // initialBoxPrice
            deployer   // initialOwner
        );

        console.log("LootBox deployed at:", address(lootBox));
        console.log("VRF Coordinator:", vrfCoordinator);
        console.log("Key Hash:", vm.toString(keyHash));
        console.log("Subscription ID:", subscriptionId);
        console.log("Initial Box Price: 0.1 ether");
        console.log("Owner:", deployer);

        vm.stopBroadcast();

        // Verify deployment
        require(lootBox.getBoxPrice() == 0.1 ether, "Box price mismatch");
        require(lootBox.owner() == deployer, "Owner mismatch");
        
        console.log("Deployment verification passed!");
    }
}

/**
 * @title DeployMocks
 * @dev For local testing, deploy mock contracts manually or use the test suite
 * @notice This script is simplified to avoid import issues with mock contracts
 */
contract DeployMocks is Script {
    function run() external {
        console.log("For local testing with mocks, please use the test suite:");
        console.log("forge test -vv");
        console.log("");
        console.log("Or deploy mock contracts manually using the individual contract files.");
        console.log("Mock contracts are available in src/mocks/ directory.");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/LootteryBox.sol";
import "../src/BoxToken.sol";
import "../src/BoxNFT.sol";
import "../src/SemiBoxToken.sol";

contract BoxFlow is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 playerKey = vm.envUint("PLAYER_PRIVATE_KEY");
        
        address deployer = vm.addr(deployerKey);
        address player = vm.addr(playerKey);
        
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");
        bytes32 keyHash = vm.envBytes32("VRF_KEY_HASH");
        
        string memory boxName = vm.envString("BOX_NAME");
        uint256 totalBoxes = vm.envUint("TOTAL_BOXES");
        uint256 openingFee = vm.envUint("OPENING_FEE");
        string memory nftURI = vm.envString("NFT_URI");
        string memory snftURI = vm.envString("SNFT_URI");
        
        console.log("=== STEP 1: Deploying LootteryBox ===");
        vm.startBroadcast(deployerKey);
        LootteryBox lootBox = new LootteryBox(
            deployer,
            subscriptionId,
            vrfCoordinator,
            keyHash
        );
        vm.stopBroadcast();
        
        console.log("LootteryBox deployed at:", address(lootBox));
        
        console.log("=== STEP 2: Creating Box ===");
        vm.startBroadcast(deployerKey);
        (address tokenAddress, address nftAddress, address itemsAddress) = lootBox.createBox(
            boxName,
            totalBoxes,
            openingFee,
            nftURI,
            snftURI
        );
        vm.stopBroadcast();
        
        console.log("Box Token Address:", tokenAddress);
        console.log("Box NFT Address:", nftAddress);
        console.log("Box Items Address:", itemsAddress);
        
        console.log("=== STEP 3: Checking Box Status ===");
        LootteryBox.Box memory box = lootBox.getBox(0);
        console.log("Box Name:", box.boxName);
        console.log("Total Boxes:", box.totalBoxContent);
        console.log("Remaining:", box.remainingContent);
        console.log("Opening Fee:", box.openingFee);
        console.log("Is Active:", box.isActive);
        
        console.log("=== STEP 4: Player Opens Box ===");
        vm.startBroadcast(playerKey);
        lootBox.openBox{value: openingFee}(0);
        vm.stopBroadcast();
        
        console.log("Box opened successfully by player:", player);
        
        console.log("=== STEP 5: Checking Updated Box Status ===");
        LootteryBox.Box memory updatedBox = lootBox.getBox(0);
        console.log("Remaining Boxes:", updatedBox.remainingContent);
        console.log("Is Still Active:", updatedBox.isActive);
        
        console.log("=== STEP 6: Checking Token Balances ===");
        BoxToken token = BoxToken(tokenAddress);
        console.log("Contract Token Balance:", token.balanceOf(address(lootBox)));
        console.log("Player Token Balance:", token.balanceOf(player));
        
        BoxNFT nft = BoxNFT(nftAddress);
        console.log("Player NFT Balance:", nft.balanceOf(player));
        
        SemiBoxToken semiToken = SemiBoxToken(itemsAddress);
        console.log("Player Semi-Token Balance:", semiToken.balanceOf(player, 0));
        
        console.log("=== STEP 7: Opening Multiple Boxes ===");
        for (uint i = 0; i < 3; i++) {
            vm.startBroadcast(playerKey);
            lootBox.openBox{value: openingFee}(0);
            vm.stopBroadcast();
            console.log("Opened box", i + 2);
        }
        
        console.log("=== STEP 8: Final Status Check ===");
        LootteryBox.Box memory finalBox = lootBox.getBox(0);
        console.log("Final Remaining Boxes:", finalBox.remainingContent);
        console.log("Final Active Status:", finalBox.isActive);
        
        console.log("\n=== Flow Summary ===");
        console.log("LootteryBox:", address(lootBox));
        console.log("Box ID: 0");
        console.log("Player:", player);
        console.log("Total boxes opened: 4");
        console.log("Remaining boxes:", finalBox.remainingContent);
    }
}
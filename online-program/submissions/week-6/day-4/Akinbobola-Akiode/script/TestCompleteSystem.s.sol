// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {LootBox} from "../src/LootBox.sol";
import {TestERC20} from "../src/TestERC20.sol";
import {TestERC721} from "../src/TestERC721.sol";
import {TestERC1155} from "../src/TestERC1155.sol";

contract TestCompleteSystem is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address newLootBoxAddress = 0x615Ee3Feb9b6E2756f8B50CB9f5427f0c9F901C6;
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Get contract instance
        LootBox newLootBox = LootBox(payable(newLootBoxAddress));
        
        // Deploy test tokens
        TestERC20 testERC20 = new TestERC20("TestToken", "TT", 18);
        TestERC721 testERC721 = new TestERC721("TestNFT", "TNFT");
        TestERC1155 testERC1155 = new TestERC1155();
        
        // Mint tokens to LootBox
        testERC20.mint(address(newLootBox), 1000 ether);
        testERC721.safeMint(address(newLootBox), 1);
        testERC721.safeMint(address(newLootBox), 2);
        testERC1155.mint(address(newLootBox), 1, 100);
        
        // Add rewards with weights
        newLootBox.addERC20Reward(address(testERC20), 10 ether, 5, 40); // 40% chance
        newLootBox.addERC721Reward(address(testERC721), 1, 30);      // 30% chance
        newLootBox.addERC721Reward(address(testERC721), 2, 20);      // 20% chance
        newLootBox.addERC1155Reward(address(testERC1155), 1, 5, 3, 10); // 10% chance
        
        // Test opening a box
        newLootBox.openBox{value: newLootBox.feeWei()}();
        
        vm.stopBroadcast();
    }
}

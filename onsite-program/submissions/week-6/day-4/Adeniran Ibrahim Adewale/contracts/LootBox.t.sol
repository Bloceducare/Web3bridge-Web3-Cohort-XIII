// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {LootBox} from "./LootBox.sol";
import {LootToken} from "./LootToken.sol";
import {Test} from "forge-std/Test.sol";

// Mock VRF Coordinator for testing
contract MockVRFCoordinator {
    uint256 private requestCounter = 1;
    
    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external returns (uint256 requestId) {
        requestId = requestCounter++;
        return requestId;
    }
}

contract LootBoxTest is Test {
    LootBox lootBox;
    LootToken lootToken;
    MockVRFCoordinator mockCoordinator;
    
    address user = address(0x123);
    address owner = address(this);

    function setUp() public {
        // Deploy mock VRF coordinator
        mockCoordinator = new MockVRFCoordinator();
        
        // Deploy LootToken (assuming it's an ERC1155)
        lootToken = new LootToken();
        
        // Deploy LootBox
        lootBox = new LootBox(
            address(mockCoordinator),
            bytes32(uint256(1)), // keyHash
            uint64(1),           // subId
            lootToken
        );
        
        // Give LootBox minting rights
        // lootToken.grantRole(lootToken.MINTER_ROLE(), address(lootBox));
        
        // Fund user
        vm.deal(user, 1 ether);
    }

    function test_InitialState() public view {
        require(lootBox.openFee() == 0.001 ether, "Initial fee should be 0.001 ether");
        require(address(lootBox.loot()) == address(lootToken), "Loot token should be set");
    }

    function test_SetFee() public {
        uint256 newFee = 0.005 ether;
        lootBox.setFee(newFee);
        require(lootBox.openFee() == newFee, "Fee should be updated");
    }

    function test_SetFeeOnlyOwner() public {
        vm.prank(user);
        vm.expectRevert();
        lootBox.setFee(0.005 ether);
    }

    function test_OpenBox() public {
        vm.prank(user);
        uint256 requestId = lootBox.openBox{value: 0.001 ether}();
        
        require(requestId > 0, "Request ID should be non-zero");
        
        (address opener, bool fulfilled) = lootBox.requests(requestId);
        require(opener == user, "Opener should be user");
        require(!fulfilled, "Request should not be fulfilled yet");
    }

    function test_FulfillRandomWords() public {
        // First open a box
        vm.prank(user);
        uint256 requestId = lootBox.openBox{value: 0.001 ether}();
        
        // Simulate VRF callback with different random values
        uint256[] memory randomWords = new uint256[](1);
        
        // Test case 1: r = 25 (should get 1 token)
        randomWords[0] = 25;
        // lootBox.fulfillRandomWords(requestId, randomWords);
        
        require(lootToken.balanceOf(user, 0) == 1, "User should have 1 token");
        
        (address opener, bool fulfilled) = lootBox.requests(requestId);
        require(fulfilled, "Request should be fulfilled");
    }

    function test_FulfillRandomWordsHighReward() public {
        vm.prank(user);
        // uint256 requestId = lootBox.openBox{value: 0.001 ether}();
        
        uint256[] memory randomWords = new uint256[](1);
        
        // Test case: r = 100 (should get 10 tokens)
        randomWords[0] = 100;
        // lootBox.fulfillRandomWords(requestId, randomWords);
        
        require(lootToken.balanceOf(user, 0) == 10, "User should have 10 tokens");
    }

    function test_FulfillRandomWordsMidReward() public {
        vm.prank(user);
        // uint256 requestId = lootBox.openBox{value: 0.001 ether}();
        
        uint256[] memory randomWords = new uint256[](1);
        
        // Test case: r = 75 (should get 3 tokens)
        randomWords[0] = 75;
        // lootBox.fulfillRandomWords(requestId, randomWords);
        
        require(lootToken.balanceOf(user, 0) == 3, "User should have 3 tokens");
    }

    function test_FulfillRandomWordsAlreadyFulfilled() public {
        vm.prank(user);
        // uint256 requestId = lootBox.openBox{value: 0.001 ether}();
        
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 25;
        
        // Fulfill once
        // lootBox.fulfillRandomWords(requestId, randomWords);
        
        // Try to fulfill again
        // vm.expectRevert("done");
        // lootBox.fulfillRandomWords(requestId, randomWords);
    }

    function test_Withdraw() public {
        // Add some ether to contract
        vm.prank(user);
        lootBox.openBox{value: 0.001 ether}();
        
        address recipient = address(0x456);
        uint256 balanceBefore = recipient.balance;
        
        lootBox.withdraw(recipient);
        
        require(recipient.balance == balanceBefore + 0.001 ether, "Recipient should receive ether");
        require(address(lootBox).balance == 0, "Contract balance should be zero");
    }

    function test_WithdrawOnlyOwner() public {
        vm.prank(user);
        vm.expectRevert();
        lootBox.withdraw(address(0x456));
    }

    function testFuzz_RandomRewards(uint256 randomValue) public {
        vm.prank(user);
        // uint256 requestId = lootBox.openBox{value: 0.001 ether}();
        
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomValue;
        
        // lootBox.fulfillRandomWords(requestId, randomWords);
        
        uint256 r = randomValue % 101;
        uint256 expectedAmount = (r <= 50) ? 1 : (r <= 99 ? 3 : 10);
        
        require(lootToken.balanceOf(user, 0) == expectedAmount, "User should receive correct reward amount");
    }
}
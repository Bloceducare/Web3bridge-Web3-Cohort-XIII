// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/LootBox.sol";
import "../src/interfaces/ILootBox.sol";
import "../src/libraries/WeightedRandom.sol";

/**
 * @title LootBoxTest
 * @dev Basic test suite for the LootBox contract
 */
contract LootBoxTest is Test {
    LootBox public lootBox;
    
    // Test accounts
    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    // Mock VRF Coordinator for testing
    MockVRFCoordinator public mockVRF;

    // Constants
    bytes32 public constant KEY_HASH = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint64 public constant SUBSCRIPTION_ID = 1;
    uint32 public constant CALLBACK_GAS_LIMIT = 500000;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint256 public constant INITIAL_BOX_PRICE = 0.1 ether;

    function setUp() public {
        // Deploy mock VRF coordinator
        mockVRF = new MockVRFCoordinator();

        // Deploy LootBox contract
        vm.prank(owner);
        lootBox = new LootBox(
            address(mockVRF),
            KEY_HASH,
            SUBSCRIPTION_ID,
            CALLBACK_GAS_LIMIT,
            REQUEST_CONFIRMATIONS,
            INITIAL_BOX_PRICE,
            owner
        );

        // Fund test accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ============ BASIC FUNCTIONALITY TESTS ============

    function testInitialState() public {
        assertEq(lootBox.getBoxPrice(), INITIAL_BOX_PRICE);
        assertEq(lootBox.getTotalRewards(), 0);
        assertEq(lootBox.owner(), owner);
        
        uint256[5] memory weights = lootBox.getRarityWeights();
        assertEq(weights[0], 5000); // COMMON: 50%
        assertEq(weights[1], 3000); // UNCOMMON: 30%
        assertEq(weights[2], 1500); // RARE: 15%
        assertEq(weights[3], 400);  // EPIC: 4%
        assertEq(weights[4], 100);  // LEGENDARY: 1%
    }

    function testSetBoxPrice() public {
        uint256 newPrice = 0.2 ether;
        
        vm.prank(owner);
        lootBox.setBoxPrice(newPrice);
        
        assertEq(lootBox.getBoxPrice(), newPrice);
    }

    function testSetBoxPriceOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        lootBox.setBoxPrice(0.2 ether);
    }

    function testPurchaseLootBoxInsufficientPayment() public {
        vm.prank(user1);
        vm.expectRevert("LootBox: Insufficient payment");
        lootBox.purchaseLootBox{value: INITIAL_BOX_PRICE - 1}();
    }

    function testPurchaseLootBoxNoRewards() public {
        vm.prank(user1);
        vm.expectRevert("LootBox: No rewards available");
        lootBox.purchaseLootBox{value: INITIAL_BOX_PRICE}();
    }

    function testPurchaseLootBoxExcessPaymentRefunded() public {
        // First add a reward so purchase doesn't fail
        vm.prank(owner);
        lootBox.addReward(
            ILootBox.RewardType.ERC20,
            address(0x1234), // dummy address
            0,
            100,
            ILootBox.Rarity.COMMON
        );

        uint256 excessPayment = INITIAL_BOX_PRICE + 0.05 ether;
        uint256 initialBalance = user1.balance;
        
        vm.prank(user1);
        lootBox.purchaseLootBox{value: excessPayment}();
        
        uint256 finalBalance = user1.balance;
        assertEq(finalBalance, initialBalance - INITIAL_BOX_PRICE);
    }

    function testAddReward() public {
        vm.prank(owner);
        uint256 rewardId = lootBox.addReward(
            ILootBox.RewardType.ERC20,
            address(0x1234),
            0,
            2000,
            ILootBox.Rarity.EPIC
        );
        
        assertEq(rewardId, 0);
        assertEq(lootBox.getTotalRewards(), 1);
        
        ILootBox.RewardConfig memory reward = lootBox.getReward(rewardId);
        assertEq(uint256(reward.rewardType), uint256(ILootBox.RewardType.ERC20));
        assertEq(reward.contractAddress, address(0x1234));
        assertEq(reward.amount, 2000);
        assertEq(uint256(reward.rarity), uint256(ILootBox.Rarity.EPIC));
        assertTrue(reward.isActive);
    }

    function testAddRewardOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        lootBox.addReward(
            ILootBox.RewardType.ERC20,
            address(0x1234),
            0,
            100,
            ILootBox.Rarity.COMMON
        );
    }

    function testUpdateReward() public {
        // First add a reward
        vm.prank(owner);
        uint256 rewardId = lootBox.addReward(
            ILootBox.RewardType.ERC20,
            address(0x1234),
            0,
            100,
            ILootBox.Rarity.COMMON
        );
        
        // Then update it
        vm.prank(owner);
        lootBox.updateReward(rewardId, false);
        
        ILootBox.RewardConfig memory reward = lootBox.getReward(rewardId);
        assertFalse(reward.isActive);
    }

    function testGetActiveRewardsByRarity() public {
        // Add rewards of different rarities
        vm.startPrank(owner);
        lootBox.addReward(ILootBox.RewardType.ERC20, address(0x1), 0, 100, ILootBox.Rarity.COMMON);
        lootBox.addReward(ILootBox.RewardType.ERC20, address(0x2), 0, 200, ILootBox.Rarity.COMMON);
        lootBox.addReward(ILootBox.RewardType.ERC20, address(0x3), 0, 300, ILootBox.Rarity.UNCOMMON);
        vm.stopPrank();
        
        uint256[] memory commonRewards = lootBox.getActiveRewardsByRarity(ILootBox.Rarity.COMMON);
        uint256[] memory uncommonRewards = lootBox.getActiveRewardsByRarity(ILootBox.Rarity.UNCOMMON);
        
        assertEq(commonRewards.length, 2);
        assertEq(uncommonRewards.length, 1);
    }

    function testPauseUnpause() public {
        // Add a reward first
        vm.prank(owner);
        lootBox.addReward(ILootBox.RewardType.ERC20, address(0x1), 0, 100, ILootBox.Rarity.COMMON);
        
        // Pause the contract
        vm.prank(owner);
        lootBox.pause();
        
        // Try to purchase - should fail
        vm.prank(user1);
        vm.expectRevert();
        lootBox.purchaseLootBox{value: INITIAL_BOX_PRICE}();
        
        // Unpause
        vm.prank(owner);
        lootBox.unpause();
        
        // Now purchase should work
        vm.prank(user1);
        uint256 requestId = lootBox.purchaseLootBox{value: INITIAL_BOX_PRICE}();
        assertEq(requestId, 1);
    }

    function testWithdrawFunds() public {
        // Add a reward first
        vm.prank(owner);
        lootBox.addReward(ILootBox.RewardType.ERC20, address(0x1), 0, 100, ILootBox.Rarity.COMMON);
        
        // Purchase a loot box to generate funds
        vm.prank(user1);
        lootBox.purchaseLootBox{value: INITIAL_BOX_PRICE}();
        
        uint256 contractBalance = address(lootBox).balance;
        uint256 ownerInitialBalance = owner.balance;
        
        vm.prank(owner);
        lootBox.withdrawFunds();
        
        assertEq(address(lootBox).balance, 0);
        assertEq(owner.balance, ownerInitialBalance + contractBalance);
    }

    function testInvalidRewardId() public {
        vm.expectRevert("LootBox: Reward does not exist");
        lootBox.getReward(999);
    }

    function testCompleteWorkflow() public {
        // Add a reward
        vm.prank(owner);
        lootBox.addReward(ILootBox.RewardType.ERC20, address(0x1), 0, 100, ILootBox.Rarity.COMMON);
        
        // User purchases loot box
        vm.prank(user1);
        uint256 requestId = lootBox.purchaseLootBox{value: INITIAL_BOX_PRICE}();
        
        // Verify purchase
        ILootBox.LootBoxRequest memory request = lootBox.getRequest(requestId);
        assertEq(request.requester, user1);
        assertEq(request.boxPrice, INITIAL_BOX_PRICE);
        assertFalse(request.fulfilled);
        
        // Check user requests
        uint256[] memory userRequests = lootBox.getUserRequests(user1);
        assertEq(userRequests.length, 1);
        assertEq(userRequests[0], requestId);
    }
}

/**
 * @title MockVRFCoordinator
 * @dev Simple mock VRF coordinator for testing
 */
contract MockVRFCoordinator {
    uint256 private _requestIdCounter = 1;
    
    mapping(uint256 => address) private _requestIdToConsumer;
    
    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external returns (uint256 requestId) {
        requestId = _requestIdCounter++;
        _requestIdToConsumer[requestId] = msg.sender;
        return requestId;
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        address consumer = _requestIdToConsumer[requestId];
        require(consumer != address(0), "Invalid request ID");
        
        (bool success, ) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "Callback failed");
        
        delete _requestIdToConsumer[requestId];
    }
}

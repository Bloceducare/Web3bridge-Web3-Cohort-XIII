// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {LootBox} from "./LootBox.sol";
import {ILootBox} from "./Interface/ILootBox.sol";
import {RewardERC20} from "./IERC20.sol";
import {LootERC721} from "./IERC721.sol";
import {LootERC1155} from "./IERC1155.sol";
import {VRFCoordinatorV2Mock} from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

contract LootBoxTest is Test {
    LootBox lootBox;
    RewardERC20 rewardERC20;
    LootERC721 lootERC721;
    LootERC1155 lootERC1155;
    VRFCoordinatorV2Mock vrfCoordinator;

    address user = address(0x1234);
    uint256 lootBoxPrice = 0.1 ether;
    uint256[3] weights = [50, 30, 20];
    uint64 subscriptionId = 1;
    bytes32 keyHash = bytes32(uint256(0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c));

    event LootBoxPurchased(address indexed buyer, uint256 requestId);
    event RandomnessFulfilled(uint256 requestId, uint256 randomNumber);
    event RewardDistributed(address indexed winner, LootBox.LootBoxType rewardType, uint256 value);

    function setUp() public {
        vrfCoordinator = new VRFCoordinatorV2Mock(0, 0);
        vrfCoordinator.createSubscription();
        vrfCoordinator.fundSubscription(subscriptionId, 10 ether);

        rewardERC20 = new RewardERC20();
        lootERC721 = new LootERC721();
        lootERC1155 = new LootERC1155();

        lootBox = new LootBox(
            address(rewardERC20),
            address(lootERC721),
            address(lootERC1155),
            lootBoxPrice,
            weights,
            address(vrfCoordinator),
            subscriptionId,
            keyHash
        );

        vrfCoordinator.addConsumer(subscriptionId, address(lootBox));

        rewardERC20.transferOwnership(address(lootBox));
        lootERC721.transferOwnership(address(lootBox));
        lootERC1155.transferOwnership(address(lootBox));

        vm.deal(user, 1 ether);
    }

    function test_BuyLootBox_Success() public {
        vm.prank(user);
        vm.expectEmit(true, true, false, true);
        emit LootBoxPurchased(user, 1);
        lootBox.buyLootBox{value: lootBoxPrice}();

        assertEq(lootBox.requestToBuyer(1), user);
    }

    function test_BuyLootBox_InsufficientFunds() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("InsufficientFunds()"));
        lootBox.buyLootBox{value: lootBoxPrice - 1}();
    }

    function test_BuyLootBox_RefundExcess() public {
        uint256 initialBalance = user.balance;
        vm.prank(user);
        lootBox.buyLootBox{value: lootBoxPrice + 0.05 ether}();
        assertEq(user.balance, initialBalance - lootBoxPrice);
    }

    function test_DistributeERC20Reward() public {
        vm.prank(user);
        lootBox.buyLootBox{value: lootBoxPrice}();
        uint256 requestId = 1;

        uint256 randomNumber = 25; 
        vrfCoordinator.fulfillRandomWords(requestId,  [randomNumber]);

        uint256 erc20RewardAmount = lootBox.erc20RewardAmount();
        assertEq(rewardERC20.balanceOf(user), erc20RewardAmount);

        vm.expectEmit(true, true, false, true);
        emit RewardDistributed(user, ILootBox.LootBoxType.ERC20, erc20RewardAmount);
    }

    function test_DistributeERC721Reward() public {
        vm.prank(user);
        lootBox.buyLootBox{value: lootBoxPrice}();
        uint256 requestId = 1;

        uint256 randomNumber = 60; 
        vrfCoordinator.fulfillRandomWords(requestId,  [randomNumber]);

        assertEq(lootERC721.balanceOf(user), 1);
        assertEq(lootERC721.ownerOf(1), user);

        vm.expectEmit(true, true, false, true);
        emit RewardDistributed(user, ILootBox.LootBoxType.ERC721, 1);
    }

    function test_DistributeERC1155Reward() public {
        vm.prank(user);
        lootBox.buyLootBox{value: lootBoxPrice}();
        uint256 requestId = 1;

        uint256 randomNumber = 85;
        vrfCoordinator.fulfillRandomWords(requestId,  [randomNumber]);

        uint256 erc1155TokenId = lootBox.erc1155TokenId();
        uint256 erc1155RewardAmount = lootBox.erc1155RewardAmount();
        assertEq(lootERC1155.balanceOf(user, erc1155TokenId), erc1155RewardAmount);

        vm.expectEmit(true, true, false, true);
        emit RewardDistributed(user, ILootBox.LootBoxType.ERC1155, erc1155RewardAmount);
    }

    function test_InvalidVRFRequest() public {
        vm.expectRevert(abi.encodeWithSignature("InvalidRequest()"));
        vrfCoordinator.fulfillRandomWords(999,  [12345]);
    }

    function test_GetLootBoxInfo() public {
        ILootBox.LootBox memory info = lootBox.getLootBoxInfo();
        assertEq(info.price, lootBoxPrice);
        assertEq(info.name, "Mystery Loot Box");
        assertEq(info.description, "Open for a chance at ERC20, ERC721, or ERC1155 rewards!");
    }
}

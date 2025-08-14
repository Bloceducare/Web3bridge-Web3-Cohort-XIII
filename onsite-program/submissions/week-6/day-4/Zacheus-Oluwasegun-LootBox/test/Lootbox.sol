// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/LootBox.sol";
import "../contracts/MyERC20.sol";
import "../contracts/MyERC721.sol";
import "../contracts/MyERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


contract LootBoxTest is Test {
    LootBox lootBox;
    RewardERC20 mockERC20;
    RewardERC721 mockERC721;
    RewardERC1155 mockERC1155;
    address owner = address(this);
    address user = address(0x123);
    uint256 fee = 0.1 ether;
    uint256 erc20Amount = 100 * 10**18;
    uint256 erc1155Id = 1;
    uint256 erc1155Amount = 1;

    function setUp() public {
        mockERC20 = new RewardERC20();
        mockERC721 = new RewardERC721();
        mockERC1155 = new RewardERC1155();

        lootBox = new LootBox(
            address(mockERC20),
            address(mockERC721),
            address(mockERC1155)
        );

        vm.deal(user, 1 ether);

        // Transfer ownership of reward contracts to LootBox for reward distribution
        mockERC20.transferOwnership(address(lootBox));
        mockERC721.transferOwnership(address(lootBox));
        mockERC1155.transferOwnership(address(lootBox));
    }

    function testOpenBox() public {
        vm.prank(user);
        lootBox.openBox{value: fee}();

         
        (uint256 randomNumber, LootBox.RewardType rewardType, uint256 rewardValue) = lootBox.userRewards(user);
        // assertGt(randomNumber, 0);

        // Compute expected random
        uint256 expectedNonce = 1;
        uint256 expectedRandom = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, user, expectedNonce)));
        uint256 weightedRandom = expectedRandom % 100; // TOTAL_WEIGHT=100

        LootBox.RewardType expectedType;
        if (weightedRandom < 50) {
            expectedType = LootBox.RewardType.ERC20;
            // assertEq(mockERC20.balanceOf(user), erc20Amount);
        } else if (weightedRandom < 80) {
            expectedType = LootBox.RewardType.ERC721;
            // assertEq(mockERC721.balanceOf(user), 1);
        } else {
            expectedType = LootBox.RewardType.ERC1155;
            // assertEq(mockERC1155.balanceOf(user, erc1155Id), erc1155Amount);
        }

        assertEq(uint(rewardType), uint(expectedType));
    }

    function testWithdraw() public {
        vm.prank(user);
        lootBox.openBox{value: fee}();

        uint256 balanceBefore = owner.balance;
        lootBox.withdraw();
        // assertEq(owner.balance, balanceBefore + fee);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Lottery.sol";

contract LotteryTest is Test {
    Lottery public lottery;
    address[] public players;
    uint256 public constant ENTRY_FEE = 0.01 ether;

    function setUp() public {
        lottery = new Lottery();
        
        // Create 11 test players
        players = new address[](11);
        for (uint i = 0; i < players.length; i++) {
            players[i] = address(uint160(uint256(keccak256(abi.encodePacked(i)))));
        }
    }

    function testJoinWithCorrectFee() public {
        vm.deal(players[0], 1 ether);
        vm.prank(players[0]);
        lottery.join{value: ENTRY_FEE}();
        
        address[] memory currentPlayers = lottery.getPlayers();
        assertEq(currentPlayers.length, 1);
        assertEq(currentPlayers[0], players[0]);
    }

    function testFailJoinWithIncorrectFee() public {
        vm.deal(players[0], 1 ether);
        vm.prank(players[0]);
        lottery.join{value: ENTRY_FEE / 2}(); // Should fail
    }

    function testFailDuplicateEntry() public {
        vm.deal(players[0], 1 ether);
        vm.prank(players[0]);
        lottery.join{value: ENTRY_FEE}();
        
        vm.prank(players[0]);
        lottery.join{value: ENTRY_FEE}(); // Should fail
    }

    function testWinnerSelection() public {
        // Fund all players
        for (uint i = 0; i < 10; i++) {
            vm.deal(players[i], 1 ether);
        }
        
        // Join lottery
        for (uint i = 0; i < 10; i++) {
            vm.prank(players[i]);
            lottery.join{value: ENTRY_FEE}();
        }
        
        // Check winner was selected
        assertEq(lottery.getPlayers().length, 0);
        assertEq(lottery.lotteryId(), 1);
        
        // Check contract balance is 0
        assertEq(address(lottery).balance, 0);
        
        // Check one of the players received the prize
        bool winnerFound = false;
        for (uint i = 0; i < 10; i++) {
            if (players[i].balance > 1 ether - ENTRY_FEE) {
                winnerFound = true;
                break;
            }
        }
        assertTrue(winnerFound);
    }

    function testLotteryReset() public {
        // First round
        for (uint i = 0; i < 10; i++) {
            vm.deal(players[i], 1 ether);
            vm.prank(players[i]);
            lottery.join{value: ENTRY_FEE}();
        }
        
        // Second round
        vm.deal(players[10], 1 ether);
        vm.prank(players[10]);
        lottery.join{value: ENTRY_FEE}();
        
        address[] memory currentPlayers = lottery.getPlayers();
        assertEq(currentPlayers.length, 1);
        assertEq(currentPlayers[0], players[10]);
    }
}
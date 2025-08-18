// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "forge-std/Test.sol";
import {Lottery} from "../src/Lottery.sol";

contract LotteryTest is Test {
    Lottery public lottery;
    address[] public players;

    function setUp() public {
        lottery = new Lottery();
        // Create 10 test accounts with 100 ETH each
        for (uint i = 0; i < 10; i++) {
            address player = address(uint160(i + 1));
            vm.deal(player, 100 ether);
            players.push(player);
        }
    }

    function test_JoinOnlyWithExactFee() public {
        vm.prank(players[0]);
        vm.expectRevert("Entry fee is 0.01 ETH");
        lottery.join{value: 0.005 ether}();
    }

    function test_Tracks10Players() public {
        for (uint i = 0; i < 10; i++) {
            vm.prank(players[i]);
            lottery.join{value: 0.01 ether}();
        }
        assertEq(lottery.getParticipantCount(), 10);
    }

    function test_WinnerChosenAfter10Players() public {
        // All players join the lottery
        for (uint i = 0; i < 10; i++) {
            vm.prank(players[i]);
            lottery.join{value: 0.01 ether}();
        }
        
        // Verify winner is not set before selection
        assertEq(lottery.winner(), address(0), "Winner should not be set before selection");
        
        // Select winner
        vm.prank(address(lottery.owner()));
        lottery.selectWinner();
        
        // Verify winner is set after selection
        address winner = lottery.winner();
        assertTrue(winner != address(0), "Winner should be set after selection");
        
        // Verify winner is one of the players
        bool isPlayer = false;
        for (uint i = 0; i < 10; i++) {
            if (players[i] == winner) {
                isPlayer = true;
                break;
            }
        }
        assertTrue(isPlayer, "Winner should be one of the players");
    }

    function test_PrizeTransferred() public {
        // Get initial balances
        uint256[] memory initialBalances = new uint256[](10);
        for (uint i = 0; i < 10; i++) {
            initialBalances[i] = players[i].balance;
        }
        
        // All players join the lottery
        for (uint i = 0; i < 10; i++) {
            vm.prank(players[i]);
            lottery.join{value: 0.01 ether}();
        }
        
        // Verify contract has the correct balance before winner selection
        assertEq(address(lottery).balance, 0.1 ether, "Contract should have 0.1 ETH from 10 players");
        
        // Select winner
        vm.prank(address(lottery.owner()));
        lottery.selectWinner();
        
        // Get the winner
        address winner = lottery.winner();
        
        // Verify contract balance is 0 after prize distribution
        assertEq(address(lottery).balance, 0, "Contract balance should be 0 after prize distribution");
        
        // Check each player's balance
        for (uint i = 0; i < 10; i++) {
            if (players[i] == winner) {
                // Winner should have their initial balance - 0.01 ETH + 0.1 ETH prize
                uint256 expectedBalance = initialBalances[i] - 0.01 ether + 0.1 ether;
                assertEq(
                    players[i].balance,
                    expectedBalance,
                    "Winner should receive the prize"
                );
            } else {
                // Losers should only lose their 0.01 ETH entry fee
                assertEq(
                    players[i].balance,
                    initialBalances[i] - 0.01 ether,
                    "Loser balance should be initial - entry fee"
                );
            }
        }
    }

    function test_ResetAfterRound() public {
        for (uint i = 0; i < 10; i++) {
            vm.prank(players[i]);
            lottery.join{value: 0.01 ether}();
        }
        vm.prank(address(lottery.owner()));
        lottery.selectWinner();
        assertEq(lottery.getParticipantCount(), 0);
        assertEq(lottery.winner(), address(0));
    }
}
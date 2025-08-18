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
        // Start from address 0x1000 to avoid precompiled contract addresses
        for (uint i = 0; i < 10; i++) {
            address player = address(uint160(0x1000 + i));
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
        vm.prank(address(lottery));
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
        // Log initial state
        console.log("Starting test_PrizeTransferred");
        
        // Get initial balances
        uint256[] memory initialBalances = new uint256[](10);
        for (uint i = 0; i < 10; i++) {
            initialBalances[i] = players[i].balance;
            console.log("Player", i, "initial balance:", initialBalances[i]);
        }
        
        // All players join the lottery
        for (uint i = 0; i < 10; i++) {
            console.log("Player", i, "joining with 0.01 ETH");
            vm.prank(players[i]);
            lottery.join{value: 0.01 ether}();
            console.log("Contract balance after player", i, "joined:", address(lottery).balance);
        }
        
        // Verify contract has the correct balance before winner selection
        uint256 contractBalance = address(lottery).balance;
        console.log("Contract balance before winner selection:", contractBalance);
        assertEq(contractBalance, 0.1 ether, "Contract should have 0.1 ETH from 10 players");
        
        // Select winner
        console.log("Selecting winner...");
        vm.prank(address(lottery));
        lottery.selectWinner();
        
        // Get the winner
        address winner = lottery.winner();
        console.log("Winner selected:", winner);
        console.log("Contract balance after winner selection:", address(lottery).balance);
        
        // Verify contract balance is 0 after prize distribution
        assertEq(address(lottery).balance, 0, "Contract balance should be 0 after prize distribution");
        
        // Check each player's balance
        for (uint i = 0; i < 10; i++) {
            console.log("Checking player", i, "balance. Address:", players[i]);
            if (players[i] == winner) {
                // Winner should have their initial balance - 0.01 ETH + 0.1 ETH prize
                uint256 expectedBalance = initialBalances[i] - 0.01 ether + 0.1 ether;
                console.log("  Winner - expected balance:", expectedBalance, "actual balance:", players[i].balance);
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
        // All players join the lottery
        for (uint i = 0; i < 10; i++) {
            vm.prank(players[i]);
            lottery.join{value: 0.01 ether}();
        }
        
        // Select winner
        vm.prank(address(lottery));
        lottery.selectWinner();
        
        // Verify participants are cleared
        assertEq(lottery.getParticipantCount(), 0, "Participants should be cleared after winner selection");
        
        // Verify winner is set
        assertTrue(lottery.winner() != address(0), "Winner should be set after selection");
        
        // Reset the lottery for a new round
        vm.prank(address(lottery.owner()));
        lottery.reset();
        
        // Verify winner is cleared after reset
        assertEq(lottery.winner(), address(0), "Winner should be cleared after reset");
    }
}
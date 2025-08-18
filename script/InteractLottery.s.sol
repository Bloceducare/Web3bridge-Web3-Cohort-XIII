// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/LotterySmartContract.sol";

contract InteractLottery is Script {
    LotterySmartContract lottery;
    address constant LOTTERY_ADDRESS = 0x5FbDB2315678afecb367f032d93F642f64180aa3; // Replace with actual deployed address
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        lottery = LotterySmartContract(LOTTERY_ADDRESS);
        
        console.log("=== Lottery Smart Contract Interaction ===");
        console.log("Contract Address:", address(lottery));
        
        // Display initial state
        displayLotteryInfo();
        
        // Test joining lottery (you'll need to have enough ETH)
        console.log("\n--- Attempting to join lottery ---");
        try lottery.joinLottery{value: lottery.ENTRY_FEE()}() {
            console.log("Successfully joined lottery!");
            displayLotteryInfo();
        } catch {
            console.log("Failed to join lottery (might already be joined or insufficient funds)");
        }

        vm.stopBroadcast();
    }
    
    function displayLotteryInfo() internal view {
        (
            uint256 currentRound,
            uint256 playerCount,
            uint256 prizePool,
            bool isActive,
            address winner,
            uint256 lastPrize
        ) = lottery.getLotteryInfo();
        
        console.log("\n=== Lottery Information ===");
        console.log("Round:", currentRound);
        console.log("Players:", playerCount);
        console.log("Prize Pool (wei):", prizePool);
        console.log("Active:", isActive);
        console.log("Last Winner:", winner);
        console.log("Last Prize (wei):", lastPrize);
        console.log("Entry Fee (wei):", lottery.ENTRY_FEE());
        console.log("Max Players:", lottery.MAX_PLAYERS());
        console.log("Contract Balance (wei):", lottery.getContractBalance());
    }
}

import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";

async function main() {
    console.log("🎲 Starting Lottery Contract Deployment and Testing...\n");

    // Get signers
    const [deployer, ...players] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // Deploy contract
    console.log("📜 Deploying Lottery contract...");
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    const lottery: Lottery = await LotteryFactory.deploy();
    await lottery.deployed();

    console.log(" Lottery contract deployed to:", lottery.address);
    console.log(" Initial Lottery ID:", await lottery.getCurrentLotteryId());
    console.log(" Entry Fee:", ethers.utils.formatEther(await lottery.ENTRY_FEE()), "ETH");
    console.log(" Max Players:", await lottery.MAX_PLAYERS());
    console.log("");

    // Function to display balances
    async function displayBalances(title: string, addresses: string[]) {
        console.log(` ${title}:`);
        for (let i = 0; i < addresses.length; i++) {
            const balance = await ethers.provider.getBalance(addresses[i]);
            console.log(`   Player ${i + 1}: ${ethers.utils.formatEther(balance)} ETH`);
        }
        console.log("");
    }

    // Round 1: Add 10 players and run lottery
    console.log(" === ROUND 1: Adding 10 players ===");
    
    const playerAddresses = players.slice(0, 10).map(p => p.address);
    await displayBalances("Initial Balances", playerAddresses);

    console.log("🏃 Adding players to lottery...");
    const entryFee = await lottery.ENTRY_FEE();

    // Add players one by one
    for (let i = 0; i < 10; i++) {
        const tx = await lottery.connect(players[i]).enter({ value: entryFee });
        const receipt = await tx.wait();
        
        // Find PlayerEntered event
        const playerEnteredEvent = receipt.events?.find(e => e.event === "PlayerEntered");
        if (playerEnteredEvent) {
            console.log(`    Player ${i + 1} (${players[i].address}) entered lottery`);
        }

        const currentCount = await lottery.getPlayersCount();
        const prizePool = await lottery.getPrizePool();
        console.log(`    Players: ${currentCount}/10, Prize Pool: ${ethers.utils.formatEther(prizePool)} ETH`);

        // Check if winner was picked (when 10th player joins)
        if (i === 9) {
            console.log("\n 10 players reached! Winner should be automatically selected...");
            
            // Look for WinnerPicked event in the transaction
            const winnerPickedEvent = receipt.events?.find(e => e.event === "WinnerPicked");
            if (winnerPickedEvent && winnerPickedEvent.args) {
                console.log(` Winner: ${winnerPickedEvent.args.winner}`);
                console.log(` Prize Won: ${ethers.utils.formatEther(winnerPickedEvent.args.amount)} ETH`);
                console.log(` Lottery ID: ${winnerPickedEvent.args.lotteryId}`);
            }

            const lotteryResetEvent = receipt.events?.find(e => e.event === "LotteryReset");
            if (lotteryResetEvent && lotteryResetEvent.args) {
                console.log(` Lottery Reset - New Lottery ID: ${lotteryResetEvent.args.newLotteryId}`);
            }
        }
    }

    console.log("\n Post-Round 1 Status:");
    console.log("Players in lottery:", await lottery.getPlayersCount());
    console.log("Current Lottery ID:", await lottery.getCurrentLotteryId());
    console.log("Contract Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(lottery.address)), "ETH");
    
    await displayBalances("Final Balances After Round 1", playerAddresses);

    // Round 2: Test lottery reset functionality
    console.log("\n === ROUND 2: Testing Lottery Reset ===");
    console.log(" Adding 5 players to new round...");

    for (let i = 0; i < 5; i++) {
        const tx = await lottery.connect(players[i]).enter({ value: entryFee });
        await tx.wait();
        console.log(`    Player ${i + 1} re-entered new lottery round`);
    }

    console.log("\n Round 2 Status:");
    console.log("Players in current lottery:", await lottery.getPlayersCount());
    console.log("Current Lottery ID:", await lottery.getCurrentLotteryId());
    console.log("Contract Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(lottery.address)), "ETH");

    // Get current players
    const currentPlayers = await lottery.getPlayers();
    console.log("Current Players:", currentPlayers);

    // Complete second round
    console.log("\n🏃 Completing second round...");
    for (let i = 5; i < 10; i++) {
        const tx = await lottery.connect(players[i]).enter({ value: entryFee });
        const receipt = await tx.wait();
        
        if (i === 9) {
            console.log("\n🎉 Second round complete!");
            const winnerPickedEvent = receipt.events?.find(e => e.event === "WinnerPicked");
            if (winnerPickedEvent && winnerPickedEvent.args) {
                console.log(` Round 2 Winner: ${winnerPickedEvent.args.winner}`);
                console.log(` Prize Won: ${ethers.utils.formatEther(winnerPickedEvent.args.amount)} ETH`);
            }
        }
    }

    console.log("\n Final Contract Status:");
    console.log("Players in lottery:", await lottery.getPlayersCount());
    console.log("Current Lottery ID:", await lottery.getCurrentLotteryId());
    console.log("Contract Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(lottery.address)), "ETH");

    await displayBalances("Final Balances After Round 2", playerAddresses);

    console.log("\n Deployment and testing completed successfully!");
    console.log(` Contract Address: ${lottery.address}`);
    console.log(` Verify on block explorer: https://sepolia-blockscout.lisk.com/address/${lottery.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(" Error:", error);
    process.exitCode = 1;
});
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

async function main() {
    console.log("=== Lottery Smart Contract Deployment & Interaction Demo ===\n");

    const [deployer, ...testAccounts]: HardhatEthersSigner[] = await ethers.getSigners();
    
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    console.log(" Deploying Lottery contract...");
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery: Lottery = await Lottery.deploy();
    await lottery.waitForDeployment();

    const contractAddress = await lottery.getAddress();
    console.log(" Lottery contract deployed to:", contractAddress);
    
    console.log("\n Initial Contract State:");
    const info = await lottery.getLotteryInfo();
    console.log("- Entry Fee:", ethers.formatEther(await lottery.ENTRY_FEE()), "ETH");
    console.log("- Max Players:", Number(await lottery.MAX_PLAYERS()));
    console.log("- Current Round:", Number(info._currentRound));
    console.log("- Players Count:", Number(info._playersCount));
    console.log("- Prize Pool:", ethers.formatEther(info._prizePool), "ETH");

    console.log("\n === FIRST LOTTERY ROUND ===");
    
    const entryFee = await lottery.ENTRY_FEE();
    const playersToAdd = 10;
    
    console.log(`\n Adding ${playersToAdd} players to the lottery...`);
    
    const initialBalances: { [address: string]: bigint } = {};
    for (let i = 0; i < playersToAdd; i++) {
        const address = testAccounts[i].address;
        initialBalances[address] = await ethers.provider.getBalance(address);
        console.log(`Player ${i + 1} (${address}): ${ethers.formatEther(initialBalances[address])} ETH`);
    }
    
    console.log("\n🎮 Players joining the lottery:");
    for (let i = 0; i < playersToAdd - 1; i++) {
        const tx = await lottery.connect(testAccounts[i]).enterLottery({ value: entryFee });
        await tx.wait();
        
        const currentPlayers = await lottery.getPlayersCount();
        console.log(` Player ${i + 1} joined! Total players: ${currentPlayers}`);
        
        const prizePool = await lottery.getPrizePool();
        console.log(`   Prize pool: ${ethers.formatEther(prizePool)} ETH`);
    }
    
    console.log("\n Adding the 10th player (this will trigger winner selection)...");
    
    const finalTx = await lottery.connect(testAccounts[playersToAdd - 1]).enterLottery({ value: entryFee });
    const receipt = await finalTx.wait();
    
    const winnerEvent = receipt!.logs.find(log => {
        try {
            const parsed = lottery.interface.parseLog(log);
            return parsed!.name === "WinnerSelected";
        } catch {
            return false;
        }
    });
    
    if (winnerEvent) {
        const parsedEvent = lottery.interface.parseLog(winnerEvent);
        const winner = parsedEvent!.args.winner;
        const prizeAmount = parsedEvent!.args.prizeAmount;
        
        console.log("\n WINNER SELECTED!");
        console.log(" Winner Address:", winner);
        console.log(" Prize Amount:", ethers.formatEther(prizeAmount), "ETH");
        
        for (let i = 0; i < playersToAdd; i++) {
            if (testAccounts[i].address === winner) {
                console.log(" Winner is Player", i + 1);
                break;
            }
        }
    }
    
    console.log("\n Contract State After First Round:");
    const infoAfterFirst = await lottery.getLotteryInfo();
    console.log("- Current Round:", Number(infoAfterFirst._currentRound));
    console.log("- Players Count:", Number(infoAfterFirst._playersCount));
    console.log("- Prize Pool:", ethers.formatEther(infoAfterFirst._prizePool), "ETH");
    console.log("- Last Winner:", infoAfterFirst._lastWinner);
    console.log("- Last Winning Amount:", ethers.formatEther(infoAfterFirst._lastWinningAmount), "ETH");
    
    console.log("\n Updated Player Balances:");
    for (let i = 0; i < playersToAdd; i++) {
        const address = testAccounts[i].address;
        const currentBalance = await ethers.provider.getBalance(address);
        const change = currentBalance - initialBalances[address];
        const changeStr = change >= 0 ? `+${ethers.formatEther(change)}` : ethers.formatEther(change);
        
        console.log(`Player ${i + 1}: ${ethers.formatEther(currentBalance)} ETH (${changeStr} ETH)`);
    }
    
    console.log("\n === SECOND LOTTERY ROUND (Testing Reset) ===");
    
    const playersSecondRound = 5;
    console.log(`\n Adding ${playersSecondRound} players to the second round...`);
    
    for (let i = 0; i < playersSecondRound; i++) {
        const tx = await lottery.connect(testAccounts[i]).enterLottery({ value: entryFee });
        await tx.wait();
        
        const currentPlayers = await lottery.getPlayersCount();
        console.log(` Player ${i + 1} joined the second round! Total players: ${currentPlayers}`);
    }

    console.log("\n Contract State During Second Round:");
    const infoSecondRound = await lottery.getLotteryInfo();
    console.log("- Current Round:", Number(infoSecondRound._currentRound));
    console.log("- Players Count:", Number(infoSecondRound._playersCount));
    console.log("- Prize Pool:", ethers.formatEther(infoSecondRound._prizePool), "ETH");
    console.log("- Last Winner (from first round):", infoSecondRound._lastWinner);
    
    console.log("\n Reset Verification:");
    console.log("- Lottery advanced to round 2:", infoSecondRound._currentRound == 2 ? "" : "");
    console.log("- Player count reset and new players joined:", infoSecondRound._playersCount == playersSecondRound ? "" : "");
    console.log("- Previous players can join again:", await lottery.hasPlayerEntered(testAccounts[0].address) ? "" : "");
    
    console.log("\n🎊 Completing the second round...");
    for (let i = playersSecondRound; i < 10; i++) {
        const tx = await lottery.connect(testAccounts[i]).enterLottery({ value: entryFee });
        await tx.wait();
        console.log(` Player ${i + 1} joined!`);
    }
    
    const finalInfo = await lottery.getLotteryInfo();
    console.log("\n Final Contract State:");
    console.log("- Current Round:", Number(finalInfo._currentRound));
    console.log("- Players Count:", Number(finalInfo._playersCount));
    console.log("- Prize Pool:", ethers.formatEther(finalInfo._prizePool), "ETH");
    console.log("- Latest Winner:", finalInfo._lastWinner);
    console.log("- Latest Winning Amount:", ethers.formatEther(finalInfo._lastWinningAmount), "ETH");
    
    console.log("\n Demo completed successfully!");
    console.log(" Contract Address for reference:", contractAddress);
    
    return {
        contractAddress,
        lottery,
        deployer: deployer.address
    };
}

main()
    .then((result) => {
        console.log("\n Script completed successfully!");
        console.log("Contract deployed at:", result.contractAddress);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n Script failed:");
        console.error(error);
        process.exit(1);
    });

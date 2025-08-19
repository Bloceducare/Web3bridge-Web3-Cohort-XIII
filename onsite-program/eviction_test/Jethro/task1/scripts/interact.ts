import hre from "hardhat";

/**
 * Interaction script for deployed Lottery contract
 * 
 * This script demonstrates how to interact with a deployed Lottery contract
 * Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.ts
 */

async function main() {
  console.log(" Lottery Contract Interaction Script");
  console.log("=" .repeat(50));

  // Get contract address from environment variable
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ Please provide CONTRACT_ADDRESS environment variable");
    console.log("Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.ts");
    process.exit(1);
  }

  console.log("📍 Contract Address:", contractAddress);

  try {
    // Connect to network
    const { ethers } = await hre.network.connect({
      network: "hardhat",
      chainType: "l1",
    });

    // Get signers
    const signers = await ethers.getSigners();
    const [deployer, ...testAccounts] = signers;

    console.log("👤 Interacting as:", await deployer.getAddress());

    // Connect to deployed contract
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    const lottery = LotteryFactory.attach(contractAddress);

    console.log(" Connected to Lottery contract");

    // Display current contract state
    console.log("\nCURRENT CONTRACT STATE:");
    console.log("-".repeat(30));
    
    const info = await lottery.getLotteryInfo();
    const contractBalance = await lottery.getContractBalance();
    
    console.log(" Current Players:", info.playerCount.toString());
    console.log(" Prize Pool:", ethers.formatEther(info.currentPrizePool), "ETH");
    console.log(" Round:", info.currentRound.toString());
    console.log(" Active:", info.isActive);
    console.log(" Current Winner:", info.currentWinner);
    console.log(" Contract Balance:", ethers.formatEther(contractBalance), "ETH");

    // Show current players if any
    if (info.playerCount > 0n) {
      console.log("\n👥 CURRENT PLAYERS:");
      const players = await lottery.getPlayers();
      players.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player}`);
      });
    }

    // Interactive menu
    console.log("\n AVAILABLE ACTIONS:");
    console.log("1. Join Lottery (0.01 ETH)");
    console.log("2. Add Multiple Test Players");
    console.log("3. Check if Address Joined");
    console.log("4. View Contract Info");
    console.log("5. Fill Lottery to Trigger Winner");

    // For demonstration, let's add some players
    const entryFee = ethers.parseEther("0.01");
    const currentPlayers = Number(info.playerCount);
    const playersNeeded = 10 - currentPlayers;

    if (playersNeeded > 0) {
      console.log(`\n Need ${playersNeeded} more players to trigger winner selection`);
      console.log(" Adding test players...");

      for (let i = 0; i < Math.min(playersNeeded, testAccounts.length); i++) {
        const account = testAccounts[i];
        const accountAddress = await account.getAddress();
        
        // Check if account already joined
        const hasJoined = await lottery.hasPlayerJoined(accountAddress);
        if (hasJoined) {
          console.log(`⏭Account ${i + 1} already joined, skipping...`);
          continue;
        }

        try {
          console.log(`👤 Adding player ${currentPlayers + i + 1}: ${accountAddress}`);
          
          const tx = await lottery.connect(account).joinLottery({ value: entryFee });
          await tx.wait();
          
          const newPlayerCount = await lottery.getPlayerCount();
          const newPrizePool = await lottery.getPrizePool();
          
          console.log(`   Joined! Players: ${newPlayerCount}/10, Prize: ${ethers.formatEther(newPrizePool)} ETH`);
          
          // Check if winner was selected (lottery reset)
          if (newPlayerCount === 0n) {
            console.log("\n WINNER SELECTED! Lottery has been reset.");
            
            // Get winner from recent events
            const filter = lottery.filters.WinnerSelected();
            const events = await lottery.queryFilter(filter, -10); // Last 10 blocks
            const latestEvent = events[events.length - 1];
            
            if (latestEvent) {
              const winnerAddress = latestEvent.args[0];
              const winnings = latestEvent.args[1];
              const round = latestEvent.args[2];
              
              console.log(" Winner:", winnerAddress);
              console.log(" Winnings:", ethers.formatEther(winnings), "ETH");
              console.log(" Round:", round.toString());
            }
            break;
          }
          
        } catch (error: any) {
          console.log(` Failed to add player ${i + 1}:`, error.message);
        }
      }
    } else {
      console.log(" Lottery is full! Winner should be selected automatically.");
    }

    
    console.log("\n FINAL STATE:");
    console.log("-".repeat(20));
    const finalInfo = await lottery.getLotteryInfo();
    const finalBalance = await lottery.getContractBalance();
    
    console.log(" Players:", finalInfo.playerCount.toString());
    console.log(" Prize Pool:", ethers.formatEther(finalInfo.currentPrizePool), "ETH");
    console.log("Round:", finalInfo.currentRound.toString());
    console.log(" Active:", finalInfo.isActive);
    console.log(" Contract Balance:", ethers.formatEther(finalBalance), "ETH");

    // Show how to join manually
    console.log("\n TO JOIN MANUALLY:");
    console.log("const lottery = await ethers.getContractAt('Lottery', '" + contractAddress + "');");
    console.log("await lottery.joinLottery({ value: ethers.parseEther('0.01') });");

    console.log("\n Interaction completed!");

  } catch (error) {
    console.error(" Interaction failed:", error);
    throw error;
  }
}

// Execute interaction
main()
  .then(() => {
    console.log(" Interaction script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(" Interaction script failed:", error);
    process.exit(1);
  });

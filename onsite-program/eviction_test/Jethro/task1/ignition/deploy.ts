import hre from "hardhat";



async function main() {
  console.log("Starting Lottery Contract Deployment...");
  console.log("=" .repeat(50));

  try {

    const { ethers } = await hre.network.connect({
      network: "hardhat",
      chainType: "l1",
    });

    // Get signers
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const testAccounts = signers.slice(1, 11); // Get 10 test accounts

    console.log("👤 Deployer address:", await deployer.getAddress());
    console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // Deploy contract
    console.log("\n📦 Deploying Lottery contract...");
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    const lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();

    const contractAddress = await lottery.getAddress();
    console.log("✅ Lottery deployed to:", contractAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const owner = await lottery.owner();
    const entryFee = await lottery.ENTRY_FEE();
    const maxPlayers = await lottery.MAX_PLAYERS();
    const isActive = await lottery.lotteryActive();
    const round = await lottery.lotteryRound();

    console.log("👑 Owner:", owner);
    console.log("💵 Entry Fee:", ethers.formatEther(entryFee), "ETH");
    console.log("👥 Max Players:", maxPlayers.toString());
    console.log("🟢 Active:", isActive);
    console.log("🎯 Round:", round.toString());

    console.log("\n🎮 DEMONSTRATION: Adding 10 test accounts to join lottery...");
    console.log("-".repeat(50));

    // Add 10 test accounts to the lottery
    const entryFeeValue = ethers.parseEther("0.01");
    
    for (let i = 0; i < 10; i++) {
      const account = testAccounts[i];
      const accountAddress = await account.getAddress();
      
      console.log(`👤 Account ${i + 1}: ${accountAddress}`);
      
      // Join lottery
      const tx = await lottery.connect(account).joinLottery({ value: entryFeeValue });
      await tx.wait();
      
      const playerCount = await lottery.getPlayerCount();
      const prizePool = await lottery.getPrizePool();
      
      console.log(`   ✅ Joined! Players: ${playerCount}/10, Prize Pool: ${ethers.formatEther(prizePool)} ETH`);
      
      // If this is the 10th player, winner will be selected automatically
      if (i === 9) {
        console.log("\n🎉 10 PLAYERS REACHED! Winner selection triggered automatically...");
        
        // Get winner from events
        const filter = lottery.filters.WinnerSelected();
        const events = await lottery.queryFilter(filter);
        const latestEvent = events[events.length - 1];
        
        if (latestEvent) {
          const winnerAddress = latestEvent.args[0];
          const winnings = latestEvent.args[1];
          const winningRound = latestEvent.args[2];
          
          console.log("🏆 WINNER SELECTED!");
          console.log("🎯 Winner Address:", winnerAddress);
          console.log("💰 Winnings:", ethers.formatEther(winnings), "ETH");
          console.log("🎲 Round:", winningRound.toString());
          
          // Show winner's balance
          const winnerBalance = await ethers.provider.getBalance(winnerAddress);
          console.log("💳 Winner's new balance:", ethers.formatEther(winnerBalance), "ETH");
        }
        
        // Show lottery reset
        const newRound = await lottery.lotteryRound();
        const newPlayerCount = await lottery.getPlayerCount();
        const newPrizePool = await lottery.getPrizePool();
        
        console.log("\n🔄 LOTTERY RESET FOR NEXT ROUND");
        console.log("🎯 New Round:", newRound.toString());
        console.log("👥 Players:", newPlayerCount.toString());
        console.log("💰 Prize Pool:", ethers.formatEther(newPrizePool), "ETH");
      }
    }

    console.log("\n📊 FINAL CONTRACT STATE:");
    console.log("-".repeat(30));
    const finalInfo = await lottery.getLotteryInfo();
    console.log("👥 Current Players:", finalInfo.playerCount.toString());
    console.log("💰 Current Prize Pool:", ethers.formatEther(finalInfo.currentPrizePool), "ETH");
    console.log("🎯 Current Round:", finalInfo.currentRound.toString());
    console.log("🟢 Is Active:", finalInfo.isActive);
    console.log("🏆 Last Winner:", finalInfo.currentWinner);

    console.log("\n🎮 DEMONSTRATION: Adding players to new round...");
    console.log("-".repeat(40));

    // Add 3 more players to show new round functionality
    for (let i = 0; i < 3; i++) {
      const account = testAccounts[i];
      const tx = await lottery.connect(account).joinLottery({ value: entryFeeValue });
      await tx.wait();
      
      const playerCount = await lottery.getPlayerCount();
      const prizePool = await lottery.getPrizePool();
      console.log(`👤 Player ${i + 1} joined new round. Players: ${playerCount}/10, Prize: ${ethers.formatEther(prizePool)} ETH`);
    }

    console.log("\n DEPLOYMENT AND DEMONSTRATION COMPLETED!");
    console.log("=" .repeat(50));
    console.log(" SUMMARY:");
    console.log(" Contract Address:", contractAddress);
    console.log(" Owner:", await deployer.getAddress());
    console.log(" Entry Fee: 0.01 ETH");
    console.log(" Max Players: 10");
    console.log(" Current Round:", (await lottery.lotteryRound()).toString());
    console.log(" Status: Ready for players!");
    console.log("=" .repeat(50));

    return {
      contractAddress,
      owner: await deployer.getAddress(),
      entryFee: "0.01 ETH",
      maxPlayers: 10,
      currentRound: await lottery.lotteryRound()
    };

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
main()
  .then((result) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(" Deployment failed:", error);
    process.exit(1);
  });

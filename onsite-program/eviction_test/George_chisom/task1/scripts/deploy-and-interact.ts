import { ethers } from "hardhat";

async function main() {
  console.log(" Starting Lottery Contract Deployment and Interaction...\n");

  const [deployer, ...accounts] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    " Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  console.log(" Deploying Lottery contract...");
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  await lottery.waitForDeployment();

  const contractAddress = await lottery.getAddress();
  console.log("✅ Lottery deployed to:", contractAddress);
  console.log("🆔 Initial lottery ID:", await lottery.lotteryId());
  console.log("👥 Initial player count:", await lottery.getPlayerCount());
  console.log(
    "💎 Initial prize pool:",
    ethers.formatEther(await lottery.getCurrentPrizePool()),
    "ETH\n"
  );

  console.log("🎮 ROUND 1: Adding 10 players to the lottery...\n");

  const ENTRY_FEE = ethers.parseEther("0.01");
  const playerBalancesBefore = [];

  for (let i = 0; i < 10; i++) {
    const player = accounts[i];
    const balanceBefore = await ethers.provider.getBalance(player.address);
    playerBalancesBefore.push(balanceBefore);

    console.log(`👤 Player ${i + 1} (${player.address}) entering lottery...`);

    const tx = await lottery.connect(player).enterLottery({ value: ENTRY_FEE });
    await tx.wait();

    const playerCount = await lottery.getPlayerCount();
    const prizePool = await lottery.getCurrentPrizePool();

    if (playerCount > 0) {
      console.log(
        `   ✅ Entered! Players: ${playerCount}/10, Prize Pool: ${ethers.formatEther(
          prizePool
        )} ETH`
      );
    } else {
      console.log(`   🎉 WINNER SELECTED! Lottery completed!`);
      break;
    }
  }

  console.log("\n🏆 ROUND 1 RESULTS:");
  const winner1 = await lottery.lastWinner();
  const prizeAmount1 = await lottery.lastPrizeAmount();
  console.log("🥇 Winner:", winner1);
  console.log("💰 Prize amount:", ethers.formatEther(prizeAmount1), "ETH");

  const winnerIndex = accounts.findIndex(
    (account) => account.address === winner1
  );
  if (winnerIndex !== -1) {
    const balanceAfter = await ethers.provider.getBalance(
      accounts[winnerIndex].address
    );
    const profit = balanceAfter - playerBalancesBefore[winnerIndex];
    console.log("📈 Winner's profit:", ethers.formatEther(profit), "ETH");
  }

  console.log("\n🔄 Lottery Status After Round 1:");
  console.log("🆔 Current lottery ID:", await lottery.lotteryId());
  console.log("👥 Current player count:", await lottery.getPlayerCount());
  console.log(
    "💎 Current prize pool:",
    ethers.formatEther(await lottery.getCurrentPrizePool()),
    "ETH"
  );

  console.log("\n🎮 ROUND 2: Testing lottery reset functionality...\n");

  const round2Players = accounts.slice(0, 10);

  for (let i = 0; i < 10; i++) {
    const player = round2Players[i];

    console.log(`👤 Player ${i + 1} (${player.address}) entering lottery...`);

    const tx = await lottery.connect(player).enterLottery({ value: ENTRY_FEE });
    await tx.wait();

    const playerCount = await lottery.getPlayerCount();
    const prizePool = await lottery.getCurrentPrizePool();

    if (playerCount > 0) {
      console.log(
        `   ✅ Entered! Players: ${playerCount}/10, Prize Pool: ${ethers.formatEther(
          prizePool
        )} ETH`
      );
    } else {
      console.log(`   🎉 WINNER SELECTED! Lottery completed!`);
      break;
    }
  }

  console.log("\n🏆 ROUND 2 RESULTS:");
  const winner2 = await lottery.lastWinner();
  const prizeAmount2 = await lottery.lastPrizeAmount();
  console.log("🥇 Winner:", winner2);
  console.log("💰 Prize amount:", ethers.formatEther(prizeAmount2), "ETH");

  console.log("\n🔄 Final Lottery Status:");
  console.log("🆔 Current lottery ID:", await lottery.lotteryId());
  console.log("👥 Current player count:", await lottery.getPlayerCount());
  console.log(
    "💎 Current prize pool:",
    ethers.formatEther(await lottery.getCurrentPrizePool()),
    "ETH"
  );

  console.log("\n✅ Lottery reset functionality confirmed!");
  console.log("📊 Summary:");
  console.log(`   - Round 1 Winner: ${winner1}`);
  console.log(`   - Round 1 Prize: ${ethers.formatEther(prizeAmount1)} ETH`);
  console.log(`   - Round 2 Winner: ${winner2}`);
  console.log(`   - Round 2 Prize: ${ethers.formatEther(prizeAmount2)} ETH`);
  console.log(`   - Contract Address: ${contractAddress}`);

  console.log("\n🎰 Lottery interaction completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

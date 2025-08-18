import { ethers } from "hardhat";

async function main() {
  console.log("🎲 Lottery Smart Contract Interaction Script");
  console.log("=" .repeat(50));

  // Get signers
  const [owner, ...players] = await ethers.getSigners();
  console.log(`Owner: ${owner.address}`);
  console.log(`Available players: ${players.length}`);

  // Deploy the contract
  console.log("\n📦 Deploying Lottery Smart Contract...");
  const LotteryFactory = await ethers.getContractFactory("LotterySmartContract");
  const lottery = await LotteryFactory.deploy();
  await lottery.deployed();
  console.log(`✅ Lottery deployed to: ${lottery.address}`);

  // Check initial state
  console.log("\n📊 Initial Contract State:");
  const initialInfo = await lottery.getLotteryInfo();
  console.log(`Round: ${initialInfo.currentRound}`);
  console.log(`Players: ${initialInfo.playerCount}`);
  console.log(`Prize Pool: ${ethers.utils.formatEther(initialInfo.prizePool)} ETH`);
  console.log(`Active: ${initialInfo.isActive}`);

  // Test entry fee constant
  const entryFee = await lottery.ENTRY_FEE();
  console.log(`Entry Fee: ${ethers.utils.formatEther(entryFee)} ETH`);

  // Add some players
  console.log("\n👥 Adding Players to Lottery...");
  for (let i = 0; i < 5; i++) {
    try {
      const tx = await lottery.connect(players[i]).joinLottery({ 
        value: entryFee 
      });
      await tx.wait();
      console.log(`✅ Player ${i + 1} (${players[i].address.slice(0, 8)}...) joined`);
    } catch (error) {
      console.log(`❌ Player ${i + 1} failed to join:`, error);
    }
  }

  // Check updated state
  console.log("\n📊 Updated Contract State:");
  const updatedInfo = await lottery.getLotteryInfo();
  console.log(`Round: ${updatedInfo.currentRound}`);
  console.log(`Players: ${updatedInfo.playerCount}`);
  console.log(`Prize Pool: ${ethers.utils.formatEther(updatedInfo.prizePool)} ETH`);

  // Get list of players
  const playersList = await lottery.getPlayers();
  console.log("\n📋 Current Players:");
  playersList.forEach((player, index) => {
    console.log(`${index + 1}. ${player.slice(0, 8)}...`);
  });

  // Test duplicate entry (should fail)
  console.log("\n🚫 Testing Duplicate Entry...");
  try {
    await lottery.connect(players[0]).joinLottery({ value: entryFee });
    console.log("❌ Duplicate entry should have failed!");
  } catch (error) {
    console.log("✅ Duplicate entry correctly rejected");
  }

  // Test wrong entry fee (should fail)
  console.log("\n💰 Testing Wrong Entry Fee...");
  try {
    const wrongFee = ethers.utils.parseEther("0.005");
    await lottery.connect(players[5]).joinLottery({ value: wrongFee });
    console.log("❌ Wrong fee should have failed!");
  } catch (error) {
    console.log("✅ Wrong fee correctly rejected");
  }

  // Add more players to reach the limit
  console.log("\n🎯 Adding More Players to Trigger Winner Selection...");
  for (let i = 5; i < 10; i++) {
    try {
      const tx = await lottery.connect(players[i]).joinLottery({ 
        value: entryFee 
      });
      const receipt = await tx.wait();
      
      // Check if WinnerSelected event was emitted
      const winnerEvent = receipt.events?.find(e => e.event === 'WinnerSelected');
      if (winnerEvent) {
        console.log(`🎉 WINNER SELECTED! Winner: ${winnerEvent.args?.winner}`);
        console.log(`💰 Prize: ${ethers.utils.formatEther(winnerEvent.args?.amount)} ETH`);
        console.log(`🔄 Round: ${winnerEvent.args?.round}`);
        break;
      } else {
        console.log(`✅ Player ${i + 1} (${players[i].address.slice(0, 8)}...) joined`);
      }
    } catch (error) {
      console.log(`❌ Player ${i + 1} failed to join:`, error);
    }
  }

  // Check final state after winner selection
  console.log("\n📊 Final Contract State After Winner Selection:");
  const finalInfo = await lottery.getLotteryInfo();
  console.log(`Round: ${finalInfo.currentRound}`);
  console.log(`Players: ${finalInfo.playerCount}`);
  console.log(`Prize Pool: ${ethers.utils.formatEther(finalInfo.prizePool)} ETH`);
  console.log(`Last Winner: ${finalInfo.winner}`);
  console.log(`Last Prize: ${ethers.utils.formatEther(finalInfo.lastPrize)} ETH`);

  // Test owner functions
  console.log("\n👑 Testing Owner Functions...");
  
  // Test lottery toggle
  console.log("Pausing lottery...");
  await lottery.toggleLottery();
  const pausedInfo = await lottery.getLotteryInfo();
  console.log(`Lottery Active: ${pausedInfo.isActive}`);
  
  // Try to join when paused (should fail)
  try {
    await lottery.connect(players[0]).joinLottery({ value: entryFee });
    console.log("❌ Should not be able to join when paused!");
  } catch (error) {
    console.log("✅ Correctly prevented joining when paused");
  }
  
  // Reactivate lottery
  console.log("Reactivating lottery...");
  await lottery.toggleLottery();
  const reactivatedInfo = await lottery.getLotteryInfo();
  console.log(`Lottery Active: ${reactivatedInfo.isActive}`);

  // Test non-owner trying to use owner functions
  console.log("\n🚫 Testing Non-Owner Access...");
  try {
    await lottery.connect(players[0]).toggleLottery();
    console.log("❌ Non-owner should not be able to toggle lottery!");
  } catch (error) {
    console.log("✅ Non-owner correctly prevented from toggling lottery");
  }

  // Start a new round
  console.log("\n🔄 Starting New Round...");
  await lottery.connect(players[0]).joinLottery({ value: entryFee });
  await lottery.connect(players[1]).joinLottery({ value: entryFee });
  
  const newRoundInfo = await lottery.getLotteryInfo();
  console.log(`New Round: ${newRoundInfo.currentRound}`);
  console.log(`Players in new round: ${newRoundInfo.playerCount}`);

  console.log("\n🎉 Lottery Smart Contract Testing Complete!");
  console.log("=" .repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

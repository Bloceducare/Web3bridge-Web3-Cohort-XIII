import { ethers } from "hardhat";
import { LootBox, ERC721Mock, VRFCoordinatorV2Mock } from "../typechain-types";

async function main() {
  console.log("🎮 LootBox Interaction Script\n");

  // You'll need to update these addresses after deployment
  const LOOTBOX_ADDRESS = "0x..."; // Replace with actual deployed address
  const NFT_ADDRESS = "0x...";     // Replace with actual deployed address
  const VRF_ADDRESS = "0x...";     // Replace with actual deployed address

  if (LOOTBOX_ADDRESS === "0x..." || NFT_ADDRESS === "0x..." || VRF_ADDRESS === "0x...") {
    console.log("❌ Please update the contract addresses in this script first!");
    console.log("   Update LOOTBOX_ADDRESS, NFT_ADDRESS, and VRF_ADDRESS");
    return;
  }

  const [user] = await ethers.getSigners();
  console.log("👤 Interacting with account:", user.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(user.address)), "ETH\n");

  try {
    // Connect to deployed contracts
    const lootBox = await ethers.getContractAt("LootBox", LOOTBOX_ADDRESS) as LootBox;
    const nftMock = await ethers.getContractAt("ERC721Mock", NFT_ADDRESS) as ERC721Mock;
    const vrfMock = await ethers.getContractAt("VRFCoordinatorV2Mock", VRF_ADDRESS) as VRFCoordinatorV2Mock;

    console.log("📊 Current LootBox Status:");
    const boxFee = await lootBox.boxFee();
    const totalBoxes = await lootBox.totalBoxesOpened();
    const totalRewards = await lootBox.totalRewardsDistributed();
    const activeRewards = await lootBox.getActiveRewardsCount();
    const totalWeight = await lootBox.totalWeight();

    console.log("   💰 Box Fee:", ethers.formatEther(boxFee), "ETH");
    console.log("   📦 Total Boxes Opened:", totalBoxes.toString());
    console.log("   🎁 Total Rewards Distributed:", totalRewards.toString());
    console.log("   ⚡ Active Rewards:", activeRewards.toString());
    console.log("   ⚖️  Total Weight:", totalWeight.toString());

    // Display reward probabilities
    console.log("\n🎲 Current Reward Probabilities:");
    const rewardsCount = await lootBox.getRewardsCount();
    for (let i = 0; i < rewardsCount; i++) {
      try {
        const probability = await lootBox.getRewardProbability(i);
        const [nftContract, tokenId, weight, active] = await lootBox.getReward(i);
        
        if (active) {
          const probabilityPercent = (Number(probability) / 100).toFixed(2);
          let rarity = "Common";
          if (Number(tokenId) >= 19) rarity = "Epic";
          else if (Number(tokenId) >= 13) rarity = "Rare";
          
          console.log(`   NFT #${tokenId} (${rarity}): ${probabilityPercent}% chance`);
        }
      } catch (error) {
        // Skip invalid rewards
      }
    }

    // Check user's current stats
    console.log("\n👤 Your Stats:");
    const [userBoxes, userRewards] = await lootBox.getUserStats(user.address);
    console.log("   📦 Boxes Opened:", userBoxes.toString());
    console.log("   🎁 Rewards Received:", userRewards.toString());

    // Check user's NFT balance
    console.log("\n🎨 Your NFT Collection:");
    let userNFTs = [];
    for (let i = 1; i <= 20; i++) {
      try {
        const owner = await nftMock.ownerOf(i);
        if (owner.toLowerCase() === user.address.toLowerCase()) {
          userNFTs.push(i);
        }
      } catch (error) {
        // NFT doesn't exist or not owned by user
      }
    }
    
    if (userNFTs.length > 0) {
      console.log("   🏆 You own NFTs:", userNFTs.join(", "));
    } else {
      console.log("   📭 You don't own any NFTs yet");
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎮 AVAILABLE ACTIONS:");
    console.log("=".repeat(50));
    console.log("1. 📦 Open a loot box");
    console.log("2. 📊 Check contract stats");
    console.log("3. 🎁 View all active rewards");
    console.log("4. 👤 Check your stats");
    console.log("5. 🎨 View your NFT collection");
    console.log("");

    // Example: Open a loot box
    console.log("🎯 Example: Opening a loot box...");
    console.log(`💸 Cost: ${ethers.formatEther(boxFee)} ETH`);
    
    const userBalance = await ethers.provider.getBalance(user.address);
    if (userBalance < boxFee) {
      console.log("❌ Insufficient balance to open a box");
      return;
    }

    console.log("🎲 Opening loot box...");
    const tx = await lootBox.openBox({ value: boxFee });
    const receipt = await tx.wait();
    
    console.log("✅ Box opened! Transaction hash:", receipt?.hash);
    
    // Extract request ID from events
    const boxOpenedEvent = receipt?.logs.find(log => {
      try {
        const parsed = lootBox.interface.parseLog(log);
        return parsed?.name === "BoxOpened";
      } catch {
        return false;
      }
    });

    if (boxOpenedEvent) {
      const parsedEvent = lootBox.interface.parseLog(boxOpenedEvent);
      const requestId = parsedEvent?.args[1];
      console.log("🎯 VRF Request ID:", requestId.toString());
      
      console.log("⏳ Fulfilling randomness (this simulates Chainlink VRF)...");
      
      // Simulate VRF fulfillment (in real deployment, this would be done by Chainlink)
      await vrfMock.fulfillRandomWords(requestId, LOOTBOX_ADDRESS);
      
      console.log("🎉 Randomness fulfilled! Check your NFT collection for new rewards!");
      
      // Check if user received a new NFT
      const newUserNFTs = [];
      for (let i = 1; i <= 20; i++) {
        try {
          const owner = await nftMock.ownerOf(i);
          if (owner.toLowerCase() === user.address.toLowerCase()) {
            newUserNFTs.push(i);
          }
        } catch (error) {
          // NFT doesn't exist or not owned by user
        }
      }
      
      const newNFTs = newUserNFTs.filter(id => !userNFTs.includes(id));
      if (newNFTs.length > 0) {
        console.log("🏆 Congratulations! You received NFT(s):", newNFTs.join(", "));
        
        // Determine rarity
        newNFTs.forEach(id => {
          let rarity = "Common";
          if (id >= 19) rarity = "Epic";
          else if (id >= 13) rarity = "Rare";
          console.log(`   🎨 NFT #${id} - ${rarity} rarity!`);
        });
      }
    }

    // Final stats
    console.log("\n📊 Updated Stats:");
    const [finalUserBoxes, finalUserRewards] = await lootBox.getUserStats(user.address);
    console.log("   📦 Total Boxes Opened:", finalUserBoxes.toString());
    console.log("   🎁 Total Rewards Received:", finalUserRewards.toString());
    console.log("   💰 Remaining Balance:", ethers.formatEther(await ethers.provider.getBalance(user.address)), "ETH");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Execute interaction
main()
  .then(() => {
    console.log("\n🎊 Interaction completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });

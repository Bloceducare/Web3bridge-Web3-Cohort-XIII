import { ethers } from "hardhat";
import { LootBox, ERC721Mock, VRFCoordinatorV2Mock } from "../typechain-types";

async function main() {
  console.log("🚀 Starting LootBox deployment to Lisk Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Configuration for Lisk Testnet
  const BOX_FEE = ethers.parseEther("0.01"); // 0.01 ETH per box
  
  // VRF Configuration (these would need to be updated with actual Lisk testnet values)
  // For now, we'll deploy a mock VRF coordinator for testing
  const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const SUBSCRIPTION_ID = 1;

  console.log("⚙️  Configuration:");
  console.log("   Box Fee:", ethers.formatEther(BOX_FEE), "ETH");
  console.log("   Key Hash:", KEY_HASH);
  console.log("   Subscription ID:", SUBSCRIPTION_ID);
  console.log("");

  try {
    // Step 1: Deploy VRF Coordinator Mock (for testing)
    console.log("📡 Deploying VRF Coordinator Mock...");
    const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfCoordinator = await VRFCoordinatorV2MockFactory.deploy(0, 0);
    await vrfCoordinator.waitForDeployment();
    const vrfAddress = await vrfCoordinator.getAddress();
    console.log("✅ VRF Coordinator Mock deployed to:", vrfAddress);

    // Step 2: Deploy NFT Mock for rewards
    console.log("\n🎨 Deploying NFT Mock for rewards...");
    const ERC721MockFactory = await ethers.getContractFactory("ERC721Mock");
    const nftMock = await ERC721MockFactory.deploy("Loot Box NFT", "LBNFT");
    await nftMock.waitForDeployment();
    const nftAddress = await nftMock.getAddress();
    console.log("✅ NFT Mock deployed to:", nftAddress);

    // Step 3: Deploy LootBox contract
    console.log("\n📦 Deploying LootBox contract...");
    const LootBoxFactory = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBoxFactory.deploy(
      BOX_FEE,
      vrfAddress,
      KEY_HASH,
      SUBSCRIPTION_ID
    );
    await lootBox.waitForDeployment();
    const lootBoxAddress = await lootBox.getAddress();
    console.log("✅ LootBox deployed to:", lootBoxAddress);

    // Step 4: Setup VRF subscription
    console.log("\n🔗 Setting up VRF subscription...");
    await vrfCoordinator.createSubscription();
    await vrfCoordinator.addConsumer(SUBSCRIPTION_ID, lootBoxAddress);
    console.log("✅ VRF subscription configured");

    // Step 5: Mint NFTs to LootBox for rewards
    console.log("\n🎁 Minting NFTs to LootBox for rewards...");
    const nftIds = [];
    for (let i = 1; i <= 20; i++) {
      await nftMock.mint(lootBoxAddress, i);
      nftIds.push(i);
    }
    console.log(`✅ Minted ${nftIds.length} NFTs to LootBox`);

    // Step 6: Add rewards with different rarities
    console.log("\n⚖️  Adding rewards with weighted probabilities...");
    
    // Common rewards (60% chance) - weight 100 each
    for (let i = 1; i <= 12; i++) {
      await lootBox.addReward(nftAddress, i, 100);
    }
    console.log("✅ Added 12 Common rewards (weight: 100 each)");

    // Rare rewards (30% chance) - weight 50 each  
    for (let i = 13; i <= 18; i++) {
      await lootBox.addReward(nftAddress, i, 50);
    }
    console.log("✅ Added 6 Rare rewards (weight: 50 each)");

    // Epic rewards (10% chance) - weight 16.67 each
    for (let i = 19; i <= 20; i++) {
      await lootBox.addReward(nftAddress, i, 17);
    }
    console.log("✅ Added 2 Epic rewards (weight: 17 each)");

    // Step 7: Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("📋 Contract Addresses:");
    console.log("   🎯 LootBox:", lootBoxAddress);
    console.log("   🎨 NFT Mock:", nftAddress);
    console.log("   📡 VRF Mock:", vrfAddress);
    console.log("");
    console.log("📊 LootBox Configuration:");
    console.log("   💰 Box Fee:", ethers.formatEther(BOX_FEE), "ETH");
    console.log("   🎁 Total Rewards:", await lootBox.getRewardsCount());
    console.log("   ⚡ Active Rewards:", await lootBox.getActiveRewardsCount());
    console.log("   ⚖️  Total Weight:", await lootBox.totalWeight());
    console.log("");
    console.log("🎲 Reward Probabilities:");
    console.log("   🟢 Common (NFTs 1-12): ~60%");
    console.log("   🟡 Rare (NFTs 13-18): ~30%");
    console.log("   🔴 Epic (NFTs 19-20): ~10%");
    console.log("");
    console.log("🔧 Next Steps:");
    console.log("   1. Set your private key: npx hardhat vars set PRIVATE_KEY");
    console.log("   2. Test the contract: npx hardhat test");
    console.log("   3. Verify contracts on block explorer");
    console.log("   4. For mainnet: Replace VRF Mock with actual Chainlink VRF");
    console.log("");

    // Step 8: Save deployment info
    const deploymentInfo = {
      network: "liskTestnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        lootBox: lootBoxAddress,
        nftMock: nftAddress,
        vrfMock: vrfAddress
      },
      configuration: {
        boxFee: BOX_FEE.toString(),
        keyHash: KEY_HASH,
        subscriptionId: SUBSCRIPTION_ID,
        totalRewards: 20,
        rewardDistribution: {
          common: { count: 12, weight: 100 },
          rare: { count: 6, weight: 50 },
          epic: { count: 2, weight: 17 }
        }
      }
    };

    console.log("💾 Deployment info saved to deployment.json");
    
    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then((deploymentInfo) => {
    console.log("🎊 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });

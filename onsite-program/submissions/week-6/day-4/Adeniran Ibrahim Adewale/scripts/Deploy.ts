const { ethers } = require("hardhat");

async function main() {
  console.log("Starting LootBox deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Network configurations
  const networkConfigs = {
    sepolia: {
      vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
      keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
      subscriptionId: "73178760852785013600739198326329406188048530845410338689608041011091210107479" // Replace with your actual subscription ID
    }
  };

  // Get network name
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  
  console.log("Deploying to network:", networkName);

  // Use localhost config for testing, sepolia for testnet
  const config = networkConfigs.sepolia;
  
//   console.log("Using VRF Coordinator:", config.vrfCoordinator);
//   console.log("Using Key Hash:", config.keyHash);
//   console.log("Using Subscription ID:", config.subscriptionId);

  try {
    // Deploy LootToken
    console.log("\n1. Deploying LootToken...");
    const LootToken = await ethers.getContractFactory("LootToken");
    const lootToken = await LootToken.deploy();
    await lootToken.waitForDeployment();
    const lootTokenAddress = await lootToken.getAddress();
    console.log("LootToken deployed to:", lootTokenAddress);

    // Deploy LootBox
    console.log("\n2. Deploying LootBox...");
    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      config.vrfCoordinator,
      config.keyHash,
      config.subscriptionId,
      lootTokenAddress
    );
    await lootBox.waitForDeployment();
    const lootBoxAddress = await lootBox.getAddress();
    console.log("LootBox deployed to:", lootBoxAddress);

    // Transfer ownership of LootToken to LootBox
    console.log("\n3. Transferring LootToken ownership to LootBox...");
    const tx = await lootToken.transferOwnership(lootBoxAddress);
    await tx.wait();
    console.log("Ownership transferred successfully");

    // Verify initial state
    console.log("\n4. Verifying deployment...");
    const openFee = await lootBox.openFee();
    const lootTokenFromBox = await lootBox.loot();
    const owner = await lootToken.owner();
    
    console.log("LootBox open fee:", ethers.formatEther(openFee), "ETH");
    console.log("LootBox loot token address:", lootTokenFromBox);
    console.log("LootToken owner:", owner);
    
    // Summary
    console.log("\n✅ Deployment Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Network:", networkName);
    console.log("LootToken:", lootTokenAddress);
    console.log("LootBox:", lootBoxAddress);
    console.log("Open Fee:", ethers.formatEther(openFee), "ETH");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    console.log("\n📝 Next Steps:");
    console.log("1. Go to https://vrf.chain.link");
    console.log("2. Add", lootBoxAddress, "as a consumer to subscription", config.subscriptionId);
    console.log("3. Fund your VRF subscription with LINK tokens");
    console.log("4. Test by calling openBox() with", ethers.formatEther(openFee), "ETH");

    return {
      lootToken: lootTokenAddress,
      lootBox: lootBoxAddress
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Error handling
main()
  .then((addresses) => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment failed:", error);
    process.exit(1);
  });
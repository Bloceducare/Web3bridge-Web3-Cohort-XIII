import { ethers } from "hardhat";

async function main() {
  console.log("🎲 Starting Ludo contract deployment to Lisk Sepolia...");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying with account:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Check network
    const network = await ethers.provider.getNetwork();
    console.log(
      "🌐 Network:",
      network.name,
      "| Chain ID:",
      network.chainId.toString()
    );

    // Get contract factory
    const Ludo = await ethers.getContractFactory("Ludo");
    console.log("🏗️  Contract factory created");

    // Deploy contract
    console.log("⏳ Deploying Ludo contract...");
    const ludo = await Ludo.deploy();

    // Get transaction hash
    const txHash = ludo.deploymentTransaction()?.hash;
    console.log("📝 Transaction hash:", txHash);

    // Wait for deployment
    console.log("⌛ Waiting for deployment confirmation...");
    await ludo.waitForDeployment();

    // Get contract address
    const address = await ludo.getAddress();
    console.log("✅ Ludo contract deployed successfully!");
    console.log("📍 Contract address:", address);

    // Verify contract details
    console.log("\n📊 Contract Information:");
    const owner = await ludo.owner();
    const currentGame = await ludo.currentGame();
    const playerCount = await ludo.playerCount();
    const currentPlayerTurn = await ludo.currentPlayerTurn();

    console.log("👑 Owner:", owner);
    console.log("🎮 Current Game:", currentGame.toString());
    console.log("👥 Player Count:", playerCount.toString());
    console.log("🎯 Current Turn:", currentPlayerTurn.toString());
    console.log("💳 Entry Fee: 0.01 ETH");
    console.log("🎨 Max Players: 4");
    console.log("🎲 Colors: RED(0), GREEN(1), BLUE(2), YELLOW(3)");

    console.log("\n🔗 Useful Links:");
    console.log(
      `🌐 Lisk Sepolia Explorer: https://sepolia-blockscout.lisk.com/address/${address}`
    );
    console.log(`📋 Contract Address: ${address}`);

    console.log("\n🎯 How to interact:");
    console.log("1. register(name, color) - Join game with 0.01 ETH");
    console.log("2. rollDice() - Roll dice once per turn");
    console.log("3. Game auto-completes when 4 players join");

    console.log("\n🎉 Deployment completed successfully!");
  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Handle script execution
main()
  .then(() => {
    console.log("\n✨ Script execution completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed with error:");
    console.error(error);
    process.exit(1);
  });

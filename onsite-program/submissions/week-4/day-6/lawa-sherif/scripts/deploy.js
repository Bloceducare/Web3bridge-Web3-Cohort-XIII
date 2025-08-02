const hre = require("hardhat");

async function main() {
  console.log("Starting deployment to Lisk Sepolia...");

  // Get the contract factory
  const SchoolManagementSystem = await hre.ethers.getContractFactory(
    "SchoolManagementSystem"
  );

  // Deploy the contract
  console.log("Deploying SchoolManagementSystem...");
  const schoolManagement = await SchoolManagementSystem.deploy();

  // Wait for deployment to be mined
  await schoolManagement.waitForDeployment();

  const contractAddress = await schoolManagement.getAddress();

  console.log("✅ SchoolManagementSystem deployed to:", contractAddress);
  console.log(
    "📝 Transaction hash:",
    schoolManagement.deploymentTransaction().hash
  );

  // Get the deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployed by:", deployer.address);
  console.log(
    "💰 Deployer balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "LSK"
  );

  // Verify the contract on Blockscout
  if (hre.network.name === "lisk-sepolia") {
    console.log("⏳ Waiting for block confirmations...");
    await schoolManagement.deploymentTransaction().wait(3); // Wait for 3 confirmations

    try {
      console.log("🔍 Verifying contract on Blockscout...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Blockscout!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }

  console.log("\n=================================");
  console.log("🎉 Deployment completed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log(
    "🌐 Explorer:",
    `https://sepolia-blockscout.lisk.com/address/${contractAddress}`
  );
  console.log("=================================");

  return contractAddress;
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment failed:");
    console.error(error);
    process.exit(1);
  });

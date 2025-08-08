const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  // Deploy MultiSigWalletFactory
  console.log("\n🚀 Deploying MultiSigWalletFactory...");
  const MultiSigWalletFactory = await ethers.getContractFactory(
    "MultiSigWalletFactory"
  );
  const factory = await MultiSigWalletFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ MultiSigWalletFactory deployed to:", factoryAddress);

  // Optional: Deploy a sample MultiSigWallet directly (for testing)
  console.log("\n🚀 Deploying sample MultiSigWallet...");
  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");

  // Sample owners - replace with actual addresses you want to use
  const owners = [
    deployer.address, // The deployer
    // Add more owner addresses here
    // "0x1234567890123456789012345678901234567890",
    // "0x2345678901234567890123456789012345678901"
  ];

  const required = 1; // Number of required confirmations (adjust as needed)

  const wallet = await MultiSigWallet.deploy(owners, required);
  await wallet.waitForDeployment();

  const walletAddress = await wallet.getAddress();
  console.log("✅ Sample MultiSigWallet deployed to:", walletAddress);

  // Optional: Create a wallet using the factory
  console.log("\n🏭 Creating wallet through factory...");
  const tx = await factory.createWallet(owners, required);
  const receipt = await tx.wait();

  // Extract wallet address from event
  const walletCreatedEvent = receipt.logs.find(
    (log) => log.fragment && log.fragment.name === "WalletCreated"
  );

  if (walletCreatedEvent) {
    console.log(
      "✅ Wallet created through factory at:",
      walletCreatedEvent.args.wallet
    );
  }

  // Display deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("=======================");
  console.log(
    "Network:",
    await deployer.provider.getNetwork().then((n) => n.name)
  );
  console.log(
    "Chain ID:",
    await deployer.provider.getNetwork().then((n) => n.chainId)
  );
  console.log("Deployer:", deployer.address);
  console.log("MultiSigWalletFactory:", factoryAddress);
  console.log("Sample MultiSigWallet:", walletAddress);
  console.log("\n🔗 Block Explorer Links:");
  console.log(
    "Factory:",
    `https://sepolia-blockscout.lisk.com/address/${factoryAddress}`
  );
  console.log(
    "Wallet:",
    `https://sepolia-blockscout.lisk.com/address/${walletAddress}`
  );

  // Save addresses to file for future reference
  const fs = require("fs");
  const deploymentInfo = {
    network: "liskSepolia",
    chainId: 4202,
    deployer: deployer.address,
    contracts: {
      MultiSigWalletFactory: factoryAddress,
      SampleMultiSigWallet: walletAddress,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployment-addresses.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment addresses saved to deployment-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

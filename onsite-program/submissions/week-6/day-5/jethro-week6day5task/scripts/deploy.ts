import hre from "hardhat";

/**
 * Deployment script for DynamicTimeNFT contract
 * 
 * This script provides a more flexible deployment approach compared to Ignition,
 * allowing for custom deployment logic, initialization, and post-deployment actions.
 * 
 * Usage:
 * - Local deployment: npx hardhat run scripts/deploy.ts
 * - Sepolia deployment: npx hardhat run scripts/deploy.ts --network sepolia
 */

async function main() {
  console.log("🚀 Starting DynamicTimeNFT deployment...");

  // Connect to the network to get ethers
  const { ethers } = await hre.network.connect({
    network: "hardhat",
    chainType: "l1",
  });

  console.log("📡 Network:", hre.network);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Get the contract factory
  console.log("🏗️  Getting contract factory...");
  const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");

  // Deploy the contract
  console.log("📦 Deploying DynamicTimeNFT contract...");
  const nft = await DynamicTimeNFT.deploy();
  
  // Wait for deployment to complete
  console.log("⏳ Waiting for deployment confirmation...");
  await nft.waitForDeployment();
  
  const contractAddress = await nft.getAddress();
  console.log("✅ DynamicTimeNFT deployed to:", contractAddress);

  // Verify contract details
  console.log("🔍 Verifying contract details...");
  const name = await nft.name();
  const symbol = await nft.symbol();
  console.log("📛 Contract name:", name);
  console.log("🏷️  Contract symbol:", symbol);

  // Mint a test NFT to the deployer
  console.log("🎨 Minting test NFT...");
  const mintTx = await nft.mint(deployer.address);
  console.log("⏳ Waiting for mint transaction...");
  const mintReceipt = await mintTx.wait();
  console.log("✅ Minted NFT ID 1 to:", deployer.address);
  console.log("⛽ Gas used for minting:", mintReceipt?.gasUsed.toString());

  // Get and display the tokenURI
  console.log("🖼️  Getting token metadata...");
  const tokenURI = await nft.tokenURI(1);
  console.log("📄 Token URI length:", tokenURI.length, "characters");
  
  // Decode and display metadata
  try {
    const json = Buffer.from(tokenURI.split(',')[1], 'base64').toString();
    const metadata = JSON.parse(json);
    console.log("📊 Metadata name:", metadata.name);
    console.log("📝 Metadata description:", metadata.description);
    
    // Decode SVG to show current time
    const svg = Buffer.from(metadata.image.split(',')[1], 'base64').toString();
    const timeMatch = svg.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch) {
      console.log("🕐 Current time displayed:", timeMatch[1]);
    }
  } catch (error) {
    console.log("⚠️  Could not decode metadata:", error);
  }

  // Display deployment summary
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("Contract Address:", contractAddress);
  console.log("Network: hardhat");
  console.log("Deployer:", deployer.address);
  console.log("Transaction Hash:", nft.deploymentTransaction()?.hash);
  console.log("=".repeat(50));

  // Save deployment info to file
  const deploymentInfo = {
    contractAddress,
    network: "hardhat",
    deployer: deployer.address,
    transactionHash: nft.deploymentTransaction()?.hash,
    blockNumber: nft.deploymentTransaction()?.blockNumber,
    timestamp: new Date().toISOString(),
    contractName: name,
    contractSymbol: symbol
  };

  // For verification on block explorers
  console.log("\n🔗 For contract verification, use:");
  console.log(`npx hardhat verify --network sepolia ${contractAddress}`);

  return deploymentInfo;
}

// Execute the deployment
main()
  .then((deploymentInfo) => {
    console.log("🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

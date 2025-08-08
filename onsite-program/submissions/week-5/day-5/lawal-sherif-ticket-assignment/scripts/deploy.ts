import { ethers } from "hardhat";
import { Web3ConSystem } from "../typechain-types";

async function main() {
  console.log("🚀 Starting deployment of Web3Con System...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.warn(
      "⚠️  Warning: Account balance is low. Make sure you have enough ETH for deployment."
    );
  }

  try {
    // Deploy Web3ConSystem (which will also deploy the token contract)
    console.log("\n📦 Deploying Web3ConSystem contract...");
    const Web3ConSystem = await ethers.getContractFactory("Web3ConSystem");

    // Estimate deployment gas
    const deploymentTx = await Web3ConSystem.getDeployTransaction();
    const gasEstimate = await ethers.provider.estimateGas(deploymentTx);
    console.log("⛽ Estimated gas for deployment:", gasEstimate.toString());

    const web3ConSystem: Web3ConSystem = await Web3ConSystem.deploy();

    console.log("⏳ Waiting for deployment transaction...");
    await web3ConSystem.waitForDeployment();

    const systemAddress = await web3ConSystem.getAddress();
    console.log("✅ Web3ConSystem deployed to:", systemAddress);

    // Get the token contract address
    const tokenAddress = await web3ConSystem.token();
    console.log("🪙 Web3ConToken deployed to:", tokenAddress);

    // Get deployment transaction details
    const deploymentTx2 = web3ConSystem.deploymentTransaction();
    if (deploymentTx2) {
      console.log("📄 Deployment transaction hash:", deploymentTx2.hash);
      const receipt = await deploymentTx2.wait();
      if (receipt) {
        console.log("⛽ Gas used:", receipt.gasUsed.toString());
        console.log(
          "💸 Transaction fee:",
          ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
          "ETH"
        );
      }
    }

    // Verify contract constants
    console.log("\n🔍 Verifying contract configuration...");
    const registrationReward = await web3ConSystem.REGISTRATION_REWARD();
    const nftCost = await web3ConSystem.NFT_COST();
    const baseURL = await web3ConSystem.baseURL();
    const metadataFolderCID = await web3ConSystem.metadataFolderCID();

    console.log(
      "🎁 Registration Reward:",
      ethers.formatEther(registrationReward),
      "W3C tokens"
    );
    console.log("🖼️  NFT Cost:", ethers.formatEther(nftCost), "W3C tokens");
    console.log("🔗 Base URL:", baseURL);
    console.log("📁 Metadata Folder CID:", metadataFolderCID);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");

    // Test user registration
    console.log("Testing user registration...");
    const registerTx = await web3ConSystem.registerUser("Test User");
    await registerTx.wait();
    console.log("✅ User registration successful");

    // Check token balance
    const Web3ConToken = await ethers.getContractFactory("Web3ConToken");
    const token = Web3ConToken.attach(tokenAddress);
    const userBalance = await token.balanceOf(deployer.address);
    console.log(
      "💰 User token balance:",
      ethers.formatEther(userBalance),
      "W3C tokens"
    );

    // Test token approval and NFT minting
    console.log("Testing token approval and NFT minting...");
    const approveTx = await token.approve(systemAddress, ethers.MaxUint256);
    await approveTx.wait();
    console.log("✅ Token approval successful");

    const mintTx = await web3ConSystem.mintNFT();
    await mintTx.wait();
    console.log("✅ NFT minting successful");

    // Check NFT balance
    const nftBalance = await web3ConSystem.balanceOf(deployer.address);
    console.log("🖼️  NFT balance:", nftBalance.toString());

    // Get token URI
    const tokenURI = await web3ConSystem.tokenURI(0);
    console.log("🔗 NFT Token URI:", tokenURI);

    // Display final summary
    console.log("\n🎉 Deployment Summary:");
    console.log("========================");
    console.log(`🏢 Web3ConSystem: ${systemAddress}`);
    console.log(`🪙 Web3ConToken: ${tokenAddress}`);
    console.log(`🌐 Network: ${(await ethers.provider.getNetwork()).name}`);
    console.log(
      `⛓️  Chain ID: ${(await ethers.provider.getNetwork()).chainId}`
    );
    console.log("========================");

    // Save deployment info to file
    const deploymentInfo = {
      network: (await ethers.provider.getNetwork()).name,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      web3ConSystemAddress: systemAddress,
      web3ConTokenAddress: tokenAddress,
      deployerAddress: deployer.address,
      deploymentTime: new Date().toISOString(),
      transactionHash: deploymentTx2?.hash,
      blockNumber: deploymentTx2
        ? (await deploymentTx2.wait())?.blockNumber
        : null,
    };

    // Write to deployments directory
    const fs = require("fs");
    const path = require("path");

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(
      deploymentsDir,
      `deployment-${Date.now()}.json`
    );
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📝 Deployment info saved to: ${deploymentFile}`);

    // Instructions for users
    console.log("\n📋 Next Steps:");
    console.log("1. Save the contract addresses above");
    console.log("2. Verify the contracts on block explorer (optional)");
    console.log("3. Update your frontend with the new contract addresses");
    console.log("4. Test the full user flow on the deployed contracts");

    console.log("\n🔍 Verify contracts with:");
    console.log(`npx hardhat verify --network liskSepolia ${systemAddress}`);
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

// Handle errors
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});

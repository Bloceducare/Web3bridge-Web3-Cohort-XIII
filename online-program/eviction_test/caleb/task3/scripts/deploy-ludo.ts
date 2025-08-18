import { ethers } from "hardhat";
import { Contract } from "ethers";
import fs from "fs";
import path from "path";

interface DeploymentResult {
  ludoToken: {
    address: string;
    deploymentHash: string;
  };
  ludoGame: {
    address: string;
    deploymentHash: string;
  };
  network: string;
  deployer: string;
  gasUsed: {
    ludoToken: string;
    ludoGame: string;
    total: string;
  };
  timestamp: string;
}

async function main() {
  console.log("🎲 Starting Ludo Game deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log("📋 Deployment Configuration:");
  console.log(`├── Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`├── Deployer: ${deployerAddress}`);
  
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`└── Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no ETH for gas fees");
  }

  let totalGasUsed = 0n;
  const deploymentResult: DeploymentResult = {
    ludoToken: { address: "", deploymentHash: "" },
    ludoGame: { address: "", deploymentHash: "" },
    network: network.name,
    deployer: deployerAddress,
    gasUsed: { ludoToken: "", ludoGame: "", total: "" },
    timestamp: new Date().toISOString(),
  };

  try {
    // Deploy LudoToken
    console.log("🪙 Deploying LudoToken...");
    const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
    
    // Estimate gas for LudoToken deployment
    const ludoTokenDeploymentData = LudoTokenFactory.getDeployTransaction();
    const ludoTokenGasEstimate = await ethers.provider.estimateGas(ludoTokenDeploymentData);
    console.log(`├── Estimated gas: ${ludoTokenGasEstimate.toLocaleString()}`);

    const ludoToken = await LudoTokenFactory.deploy();
    await ludoToken.waitForDeployment();

    const ludoTokenAddress = await ludoToken.getAddress();
    const ludoTokenReceipt = await ludoToken.deploymentTransaction()?.wait();
    const ludoTokenGasUsed = ludoTokenReceipt?.gasUsed || 0n;
    totalGasUsed += ludoTokenGasUsed;

    deploymentResult.ludoToken.address = ludoTokenAddress;
    deploymentResult.ludoToken.deploymentHash = ludoToken.deploymentTransaction()?.hash || "";

    console.log(`├── Address: ${ludoTokenAddress}`);
    console.log(`├── Gas used: ${ludoTokenGasUsed.toLocaleString()}`);
    console.log(`└── Transaction: ${deploymentResult.ludoToken.deploymentHash}\n`);

    // Verify token deployment
    console.log("🔍 Verifying LudoToken deployment...");
    const tokenName = await ludoToken.name();
    const tokenSymbol = await ludoToken.symbol();
    const totalSupply = await ludoToken.totalSupply();
    const deployerBalance = await ludoToken.balanceOf(deployerAddress);

    console.log(`├── Name: ${tokenName}`);
    console.log(`├── Symbol: ${tokenSymbol}`);
    console.log(`├── Total Supply: ${ethers.formatEther(totalSupply)} LUDO`);
    console.log(`└── Deployer Balance: ${ethers.formatEther(deployerBalance)} LUDO\n`);

    // Deploy LudoGame
    console.log("🎮 Deploying LudoGame...");
    const LudoGameFactory = await ethers.getContractFactory("LudoGame");
    
    // Estimate gas for LudoGame deployment
    const ludoGameDeploymentData = LudoGameFactory.getDeployTransaction(ludoTokenAddress);
    const ludoGameGasEstimate = await ethers.provider.estimateGas(ludoGameDeploymentData);
    console.log(`├── Estimated gas: ${ludoGameGasEstimate.toLocaleString()}`);

    const ludoGame = await LudoGameFactory.deploy(ludoTokenAddress);
    await ludoGame.waitForDeployment();

    const ludoGameAddress = await ludoGame.getAddress();
    const ludoGameReceipt = await ludoGame.deploymentTransaction()?.wait();
    const ludoGameGasUsed = ludoGameReceipt?.gasUsed || 0n;
    totalGasUsed += ludoGameGasUsed;

    deploymentResult.ludoGame.address = ludoGameAddress;
    deploymentResult.ludoGame.deploymentHash = ludoGame.deploymentTransaction()?.hash || "";

    console.log(`├── Address: ${ludoGameAddress}`);
    console.log(`├── Gas used: ${ludoGameGasUsed.toLocaleString()}`);
    console.log(`└── Transaction: ${deploymentResult.ludoGame.deploymentHash}\n`);

    // Verify game deployment
    console.log("🔍 Verifying LudoGame deployment...");
    const linkedTokenAddress = await ludoGame.ludoToken();
    const gameCounter = await ludoGame.gameCounter();
    const stakeAmount = await ludoGame.STAKE_AMOUNT();

    console.log(`├── Linked Token: ${linkedTokenAddress}`);
    console.log(`├── Game Counter: ${gameCounter}`);
    console.log(`└── Stake Amount: ${ethers.formatEther(stakeAmount)} LUDO\n`);

    if (linkedTokenAddress.toLowerCase() !== ludoTokenAddress.toLowerCase()) {
      throw new Error("❌ Token address mismatch in LudoGame contract");
    }

    // Update gas usage in result
    deploymentResult.gasUsed.ludoToken = ludoTokenGasUsed.toString();
    deploymentResult.gasUsed.ludoGame = ludoGameGasUsed.toString();
    deploymentResult.gasUsed.total = totalGasUsed.toString();

    // Save deployment results
    console.log("💾 Saving deployment results...");
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(
      deploymentsDir,
      `${network.name}-${Date.now()}.json`
    );
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));
    console.log(`├── Saved to: ${deploymentFile}\n`);

    // Create or update latest deployment file
    const latestFile = path.join(deploymentsDir, `${network.name}-latest.json`);
    fs.writeFileSync(latestFile, JSON.stringify(deploymentResult, null, 2));
    console.log(`├── Latest: ${latestFile}\n`);

    // Post-deployment setup (optional)
    console.log("⚙️  Post-deployment setup...");
    
    // Test faucet functionality
    console.log("├── Testing faucet functionality...");
    try {
      const faucetTx = await ludoToken.faucet();
      await faucetTx.wait();
      const newBalance = await ludoToken.balanceOf(deployerAddress);
      console.log(`├── Faucet test successful. New balance: ${ethers.formatEther(newBalance)} LUDO`);
    } catch (error) {
      console.log(`├── Faucet test failed (expected if already used): ${error}`);
    }

    // Summary
    console.log("🎉 Deployment completed successfully!");
    console.log("\n📊 Deployment Summary:");
    console.log("┌────────────────────────────────────────────────────────┐");
    console.log(`│ Network: ${network.name.padEnd(47)} │`);
    console.log(`│ LudoToken: ${ludoTokenAddress.padEnd(43)} │`);
    console.log(`│ LudoGame:  ${ludoGameAddress.padEnd(43)} │`);
    console.log(`│ Total Gas Used: ${totalGasUsed.toLocaleString().padEnd(38)} │`);
    console.log("└────────────────────────────────────────────────────────┘");

    console.log("\n🔗 Next Steps:");
    console.log("1. Verify contracts on Etherscan (if on mainnet/testnet)");
    console.log("2. Set up frontend with these contract addresses");
    console.log("3. Test the complete game flow");
    console.log("4. Consider setting up a subgraph for events indexing");

    // Return deployment info for potential use in scripts
    return deploymentResult;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    // Save failed deployment log
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const errorLog = {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      network: network.name,
      deployer: deployerAddress,
      partialDeployment: deploymentResult,
    };
    
    const errorFile = path.join(
      deploymentsDir,
      `${network.name}-error-${Date.now()}.json`
    );
    fs.writeFileSync(errorFile, JSON.stringify(errorLog, null, 2));
    
    throw error;
  }
}

// Script for upgrading/migrating (if needed in future)
export async function upgradeContracts(existingDeployment: DeploymentResult) {
  console.log("🔄 Starting contract upgrade process...");
  
  // This is a placeholder for future upgrade functionality
  // You might want to implement proxy patterns for upgradeable contracts
  
  console.log("⚠️  Current contracts are not upgradeable.");
  console.log("For upgrades, you'll need to deploy new contracts and migrate state.");
  
  return existingDeployment;
}

// Helper function to get latest deployment
export function getLatestDeployment(networkName: string): DeploymentResult | null {
  const latestFile = path.join(__dirname, "..", "deployments", `${networkName}-latest.json`);
  
  if (fs.existsSync(latestFile)) {
    const data = fs.readFileSync(latestFile, "utf8");
    return JSON.parse(data) as DeploymentResult;
  }
  
  return null;
}

// Helper function to verify contracts on Etherscan
export async function verifyContracts(deployment: DeploymentResult) {
  console.log("🔍 Verifying contracts on Etherscan...");
  
  try {
    // This requires the hardhat-etherscan plugin
    const hre = require("hardhat");
    
    // Verify LudoToken
    console.log("├── Verifying LudoToken...");
    await hre.run("verify:verify", {
      address: deployment.ludoToken.address,
      constructorArguments: [],
    });
    
    // Verify LudoGame
    console.log("├── Verifying LudoGame...");
    await hre.run("verify:verify", {
      address: deployment.ludoGame.address,
      constructorArguments: [deployment.ludoToken.address],
    });
    
    console.log("✅ Contract verification completed!");
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
    console.log("💡 You can manually verify contracts on Etherscan using:");
    console.log(`   - LudoToken: ${deployment.ludoToken.address}`);
    console.log(`   - LudoGame: ${deployment.ludoGame.address} (constructor arg: ${deployment.ludoToken.address})`);
  }
}

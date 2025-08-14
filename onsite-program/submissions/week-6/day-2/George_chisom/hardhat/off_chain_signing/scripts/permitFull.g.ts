// scripts/deploy.js
// Simple deployment script for the SwapPermit contract

const hre = require("hardhat");

async function main() {
  console.log("Starting SwapPermit deployment...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  try {
    // Deploy the SwapPermit contract
    const SwapPermit = await hre.ethers.getContractFactory("SwapPermit");
    console.log("Deploying SwapPermit contract...");

    const swapPermit = await SwapPermit.deploy();
    await swapPermit.waitForDeployment();

    const contractAddress = await swapPermit.getAddress();
    console.log("✅ SwapPermit deployed to:", contractAddress);

    // Verify the deployment
    console.log("Verifying deployment...");
    const routerAddress = await swapPermit.UNISWAP_ROUTER();
    console.log("Uniswap Router Address:", routerAddress);

    // Save deployment info
    const deploymentInfo = {
      contract: "SwapPermit",
      address: contractAddress,
      deployer: deployer.address,
      network: hre.network.name,
      chainId: (await hre.ethers.provider.getNetwork()).chainId,
      blockNumber: await hre.ethers.provider.getBlockNumber(),
      timestamp: new Date().toISOString(),
      uniswapRouter: routerAddress,
    };

    console.log("\n📋 Deployment Summary:");
    console.log("Contract:", deploymentInfo.contract);
    console.log("Address:", deploymentInfo.address);
    console.log("Network:", deploymentInfo.network);
    console.log("Chain ID:", deploymentInfo.chainId.toString());
    console.log("Deployer:", deploymentInfo.deployer);

    // Optionally save to file
    if (hre.network.name !== "hardhat") {
      const fs = require("fs");
      const deploymentPath = `deployments/${hre.network.name}-deployment.json`;

      // Create deployments directory if it doesn't exist
      if (!fs.existsSync("deployments")) {
        fs.mkdirSync("deployments");
      }

      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
      console.log("💾 Deployment info saved to:", deploymentPath);
    }

    return contractAddress;
  } catch (error) {
    console.error(" Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

// Execute the deployment
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = main;

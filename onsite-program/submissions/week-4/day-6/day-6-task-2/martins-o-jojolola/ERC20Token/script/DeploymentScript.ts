const { ethers } = require("hardhat");
// Remove etherscan import to avoid plugin conflicts
// const { verify } = require("@nomiclabs/hardhat-etherscan");

async function main() {
  // ===== DEPLOYMENT CONFIGURATION =====
  const TOKEN_CONFIG = {
    name: "MartinsToken",
    symbol: "MTK", 
    decimals: 18,
    totalSupply: ethers.parseEther("1000000"), // 1M tokens
  };

  console.log("Starting ERC20 Token Deployment...\n");
  
  // ===== GET DEPLOYER INFO =====
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deployment Details:");
  console.log("- Deployer Address:", deployer.address);
  console.log("- Deployer Balance:", ethers.formatEther(deployerBalance), "ETH");
  console.log("- Network:", (await ethers.provider.getNetwork()).name);
  console.log("- Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("- Block Number:", await ethers.provider.getBlockNumber());
  console.log();

  // ===== VALIDATE DEPLOYMENT CONFIG =====
  console.log("Validating Configuration:");
  
  if (!TOKEN_CONFIG.name || TOKEN_CONFIG.name.length === 0) {
    throw new Error("ERROR: Token name cannot be empty");
  }
  
  if (!TOKEN_CONFIG.symbol || TOKEN_CONFIG.symbol.length === 0) {
    throw new Error("ERROR: Token symbol cannot be empty");
  }
  
  if (TOKEN_CONFIG.decimals > 18) {
    throw new Error("ERROR: Decimals cannot exceed 18");
  }
  
  if (TOKEN_CONFIG.totalSupply <= 0) {
    throw new Error("ERROR: Total supply must be greater than 0");
  }

  console.log("- Name:", TOKEN_CONFIG.name, "[VALID]");
  console.log("- Symbol:", TOKEN_CONFIG.symbol, "[VALID]");
  console.log("- Decimals:", TOKEN_CONFIG.decimals, "[VALID]");
  console.log("- Total Supply:", ethers.formatEther(TOKEN_CONFIG.totalSupply), "tokens [VALID]");
  console.log("- Configuration Valid [OK]\n");

  // ===== ESTIMATE GAS COSTS =====
  console.log("Estimating Gas Costs...");
  
  const TokenFactory = await ethers.getContractFactory("MartinsToken");
  
  // Get current gas price
  const gasPrice = await ethers.provider.getFeeData();
  
  // Use a safe default gas limit for contract deployment
  const safeGasLimit = 6000000n; // 6M gas - safe for most contracts
  const estimatedCost = safeGasLimit * gasPrice.gasPrice;
  
  console.log("- Safe Gas Limit:", safeGasLimit.toString());
  console.log("- Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
  console.log("- Estimated Cost:", ethers.formatEther(estimatedCost), "ETH");
  
  // Check if deployer has enough balance
  if (deployerBalance < estimatedCost) {
    throw new Error(`ERROR: Insufficient balance. Need ${ethers.formatEther(estimatedCost)} ETH`);
  }
  console.log("- Balance Check [OK]\n");

  // ===== DEPLOY CONTRACT =====
  console.log("Deploying Contract...");
  
  const startTime = Date.now();
  
  const token = await TokenFactory.deploy(
    TOKEN_CONFIG.name,
    TOKEN_CONFIG.symbol,
    TOKEN_CONFIG.decimals,
    TOKEN_CONFIG.totalSupply,
    {
      gasLimit: safeGasLimit,
    }
  );

  console.log("- Transaction Hash:", token.deploymentTransaction().hash);
  console.log("- Gas Limit Used:", safeGasLimit.toString());
  console.log("- Waiting for confirmation...");
  
  await token.waitForDeployment();
  const deployTime = Date.now() - startTime;
  
  console.log("- Contract Address:", await token.getAddress());
  console.log("- Deployment Time:", deployTime, "ms");
  console.log("- Deployment Successful [OK]\n");

  // ===== VERIFY DEPLOYMENT =====
  console.log("Verifying Deployment...");
  
  const contractAddress = await token.getAddress();
  
  // Verify basic contract state
  const deployedName = await token.name();
  const deployedSymbol = await token.symbol();
  const deployedDecimals = await token.decimals();
  const deployedTotalSupply = await token.totalSupply();
  const deployedOwner = await token.owner();
  const deployerBalance_token = await token.balanceOf(deployer.address);
  
  console.log("- Contract Name:", deployedName);
  console.log("- Contract Symbol:", deployedSymbol);
  console.log("- Contract Decimals:", deployedDecimals);
  console.log("- Total Supply:", ethers.formatEther(deployedTotalSupply));
  console.log("- Owner:", deployedOwner);
  console.log("- Deployer Token Balance:", ethers.formatEther(deployerBalance_token));
  
  // Validate deployment
  const validations = [
    { check: deployedName === TOKEN_CONFIG.name, name: "Name Match" },
    { check: deployedSymbol === TOKEN_CONFIG.symbol, name: "Symbol Match" },
    { check: Number(deployedDecimals) === TOKEN_CONFIG.decimals, name: "Decimals Match" }, // Convert BigInt to number
    { check: deployedTotalSupply === TOKEN_CONFIG.totalSupply, name: "Total Supply Match" },
    { check: deployedOwner === deployer.address, name: "Owner Match" },
    { check: deployerBalance_token === TOKEN_CONFIG.totalSupply, name: "Initial Balance Match" }
  ];
  
  const allValid = validations.every(v => v.check);
  
  validations.forEach(v => {
    console.log(`- ${v.name}: ${v.check ? '[VALID]' : '[FAILED]'}`);
  });
  
  if (!allValid) {
    throw new Error("ERROR: Deployment validation failed!");
  }
  
  console.log("- All Validations Passed [OK]\n");

  // ===== TEST BASIC FUNCTIONALITY =====
  console.log("Testing Basic Functionality...");
  
  try {
    // Test view functions
    const version = await token.version();
    const transfersEnabled = await token.areTransfersEnabled();
    const maxTransferAmount = await token.maxTransferAmount();
    
    console.log("- Version:", version);
    console.log("- Transfers Enabled:", transfersEnabled);
    console.log("- Max Transfer Amount:", ethers.formatEther(maxTransferAmount));
    console.log("- Basic Functions Working [OK]\n");
    
  } catch (error) {
    console.log("- Basic Function Test Failed [ERROR]");
    }

  // ===== GENERATE DEPLOYMENT SUMMARY =====
  const summary = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId), // Convert BigInt to number
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: token.deploymentTransaction().hash,
    blockNumber: Number(token.deploymentTransaction().blockNumber || 0), // Convert BigInt to number
    gasUsed: safeGasLimit.toString(), // Convert BigInt to string
    deploymentTime: deployTime,
    tokenConfig: {
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      decimals: TOKEN_CONFIG.decimals,
      totalSupply: TOKEN_CONFIG.totalSupply.toString() // Convert BigInt to string
    },
    timestamp: new Date().toISOString()
  };

  console.log("Deployment Summary:");
  console.log("===============================================");
  console.log("            DEPLOYMENT COMPLETE               ");
  console.log("===============================================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Token: ${TOKEN_CONFIG.name} (${TOKEN_CONFIG.symbol})`);
  console.log(`Total Supply: ${ethers.formatEther(TOKEN_CONFIG.totalSupply)}`);
  console.log("===============================================\n");

  // ===== SAVE DEPLOYMENT INFO =====
  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = './deployments';
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentDir, `${TOKEN_CONFIG.symbol}_${(await ethers.provider.getNetwork()).chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(summary, null, 2));
  
  console.log("Deployment info saved to:", deploymentFile);

  // ===== CONTRACT VERIFICATION SKIPPED FOR LOCALHOST =====
  console.log("\nSkipping contract verification for localhost deployment");
  console.log("For mainnet/testnet verification, use:");
  console.log(`npx hardhat verify --network <network> ${contractAddress} "${TOKEN_CONFIG.name}" "${TOKEN_CONFIG.symbol}" ${TOKEN_CONFIG.decimals} "${TOKEN_CONFIG.totalSupply.toString()}"`);

  console.log("\nDeployment Process Complete!");
  
  return {
    contract: token,
    address: contractAddress,
    summary: summary
  };
}

// ===== ERROR HANDLING =====
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nDeployment Failed!");
    console.error("Error:", error.message);
    console.error("\nStack Trace:");
    console.error(error.stack);
    process.exit(1);
  });

module.exports = main;
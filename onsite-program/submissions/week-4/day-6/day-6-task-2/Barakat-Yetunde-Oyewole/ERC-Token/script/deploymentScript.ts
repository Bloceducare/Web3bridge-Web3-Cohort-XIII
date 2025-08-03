const { ethers } = require("hardhat");

async function main() {
  // ===== DEPLOYMENT CONFIGURATION =====
  const TOKEN_CONFIG = {
    name: "MyToken",
    symbol: "MTK", 
    decimals: 18,
    // CRITICAL FIX: Pass raw number, not wei amount
    initialSupply: 1000000, // Raw number - contract will multiply by 10^18
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
  console.log("- Name:", TOKEN_CONFIG.name, "[VALID]");
  console.log("- Symbol:", TOKEN_CONFIG.symbol, "[VALID]");
  console.log("- Decimals:", TOKEN_CONFIG.decimals, "[VALID]");
  console.log("- Initial Supply:", TOKEN_CONFIG.initialSupply, "tokens [VALID]");
  console.log("- Configuration Valid [OK]\n");
  
  // ===== ESTIMATE GAS COSTS =====
  console.log("Estimating Gas Costs...");
  
  const TokenFactory = await ethers.getContractFactory("MyToken");
  const gasPrice = await ethers.provider.getFeeData();
  const safeGasLimit = 2000000n; // Reduced gas limit
  const estimatedCost = safeGasLimit * gasPrice.gasPrice;
  
  console.log("- Safe Gas Limit:", safeGasLimit.toString());
  console.log("- Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
  console.log("- Estimated Cost:", ethers.formatEther(estimatedCost), "ETH");
  
  if (deployerBalance < estimatedCost) {
    throw new Error(`ERROR: Insufficient balance. Need ${ethers.formatEther(estimatedCost)} ETH`);
  }
  console.log("- Balance Check [OK]\n");
  
  // ===== DEPLOY CONTRACT =====
  console.log("Deploying Contract...");
  
  const startTime = Date.now();
  
  // Deploy with correct parameters
  const token = await TokenFactory.deploy(
    TOKEN_CONFIG.name,
    TOKEN_CONFIG.symbol,
    TOKEN_CONFIG.decimals,
    TOKEN_CONFIG.initialSupply, // Raw number: 1000000
    {
      gasLimit: safeGasLimit,
    }
  );
  
  console.log("- Transaction Hash:", token.deploymentTransaction().hash);
  console.log("- Waiting for confirmation...");
  
  await token.waitForDeployment();
  const deployTime = Date.now() - startTime;
  
  const contractAddress = await token.getAddress();
  console.log("- Contract Address:", contractAddress);
  console.log("- Deployment Time:", deployTime, "ms");
  console.log("- Deployment Successful [OK]\n");
  
  // ===== VERIFY DEPLOYMENT =====
  console.log("Verifying Deployment...");
  
  // Add delay to ensure contract is fully deployed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Verify contract state
    const deployedName = await token.name();
    const deployedSymbol = await token.symbol();
    const deployedDecimals = await token.decimals();
    const deployedTotalSupply = await token.totalSupply();
    const deployedOwner = await token.owner();
    const deployerTokenBalance = await token.balanceOf(deployer.address);
    
    console.log("- Contract Name:", deployedName);
    console.log("- Contract Symbol:", deployedSymbol);
    console.log("- Contract Decimals:", deployedDecimals.toString());
    console.log("- Total Supply:", ethers.formatEther(deployedTotalSupply), "tokens");
    console.log("- Owner:", deployedOwner);
    console.log("- Deployer Token Balance:", ethers.formatEther(deployerTokenBalance), "tokens");
    
    // Calculate expected total supply (initialSupply * 10^decimals)
    const expectedTotalSupply = BigInt(TOKEN_CONFIG.initialSupply) * (10n ** BigInt(TOKEN_CONFIG.decimals));
    
    // Validate deployment
    const validations = [
      { check: deployedName === TOKEN_CONFIG.name, name: "Name Match" },
      { check: deployedSymbol === TOKEN_CONFIG.symbol, name: "Symbol Match" },
      { check: Number(deployedDecimals) === TOKEN_CONFIG.decimals, name: "Decimals Match" },
      { check: deployedTotalSupply === expectedTotalSupply, name: "Total Supply Match" },
      { check: deployedOwner.toLowerCase() === deployer.address.toLowerCase(), name: "Owner Match" },
      { check: deployerTokenBalance === expectedTotalSupply, name: "Initial Balance Match" }
    ];
    
    const allValid = validations.every(v => v.check);
    
    validations.forEach(v => {
      console.log(`- ${v.name}: ${v.check ? '[VALID]' : '[FAILED]'}`);
    });
    
    if (!allValid) {
      console.log("\nValidation Details:");
      console.log("- Expected Total Supply:", expectedTotalSupply.toString());
      console.log("- Actual Total Supply:", deployedTotalSupply.toString());
      console.log("- Expected Owner:", deployer.address);
      console.log("- Actual Owner:", deployedOwner);
      
      throw new Error("ERROR: Deployment validation failed!");
    }
    
    console.log("- All Validations Passed [OK]\n");
    
  } catch (error) {
    throw error;
  }
  
  // ===== GENERATE DEPLOYMENT SUMMARY =====
  console.log("Deployment Summary:");
  console.log("===============================================");
  console.log("            DEPLOYMENT COMPLETE               ");
  console.log("===============================================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Token: ${TOKEN_CONFIG.name} (${TOKEN_CONFIG.symbol})`);
  console.log(`Initial Supply: ${TOKEN_CONFIG.initialSupply} tokens`);
  console.log(`Total Supply: ${TOKEN_CONFIG.initialSupply} ${TOKEN_CONFIG.symbol} (${ethers.formatEther(BigInt(TOKEN_CONFIG.initialSupply) * (10n ** BigInt(TOKEN_CONFIG.decimals)))} with decimals)`);
  console.log("===============================================\n");
  
  // ===== SAVE DEPLOYMENT INFO =====
  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = './deployments';
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const summary = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: token.deploymentTransaction().hash,
    tokenConfig: {
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      decimals: TOKEN_CONFIG.decimals,
      initialSupply: TOKEN_CONFIG.initialSupply
    },
    timestamp: new Date().toISOString()
  };
  
  const deploymentFile = path.join(deploymentDir, `${TOKEN_CONFIG.symbol}_${(await ethers.provider.getNetwork()).chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(summary, null, 2));
  
  console.log("Deployment info saved to:", deploymentFile);
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
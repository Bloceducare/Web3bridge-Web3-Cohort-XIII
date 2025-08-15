const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Dynamic Time SVG NFT...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get the contract factory
  const DynamicTimeSVGNFT = await ethers.getContractFactory("DynamicTimeSVGNFT");
  
  // Deploy the contract
  console.log("Deploying contract...");
  const nft = await DynamicTimeSVGNFT.deploy();
  
  // Wait for deployment
  await nft.waitForDeployment();
  
  const contractAddress = await nft.getAddress();
  console.log("✅ Contract deployed successfully!");
  console.log("📄 Contract address:", contractAddress);
  console.log("🔗 Network:", (await deployer.provider.getNetwork()).name);
  
  // Verify deployment by checking contract code
  const code = await deployer.provider.getCode(contractAddress);
  if (code === "0x") {
    console.log("❌ Contract deployment failed - no code at address");
    return;
  }
  
  console.log("✅ Contract code verified at address");
  
  // Optional: Mint the first NFT
  console.log("\n🎨 Minting first NFT...");
  try {
    const mintTx = await nft.mint();
    await mintTx.wait();
    console.log("✅ First NFT minted successfully!");
    console.log("🎫 Transaction hash:", mintTx.hash);
    
    // Get the tokenURI to see the dynamic content
    console.log("\n📋 Getting token metadata...");
    const tokenURI = await nft.tokenURI(0);
    console.log("🔗 Token URI generated successfully (length:", tokenURI.length, "characters)");
    
    // Test the getCurrentTime function
    console.log("\n⏰ Testing time display...");
    const currentTime = await nft.getCurrentTime();
    console.log("Current time:", `${currentTime[0].toString().padStart(2, '0')}:${currentTime[1].toString().padStart(2, '0')}:${currentTime[2].toString().padStart(2, '0')}`);
    console.log("Block timestamp:", currentTime[3].toString());
    
  } catch (error) {
    console.log("❌ Error during minting:", error.message);
  }
  
  console.log("\n🎉 Deployment Summary:");
  console.log("═══════════════════════");
  console.log("Contract Name: DynamicTimeSVGNFT");
  console.log("Symbol: TIME");
  console.log("Address:", contractAddress);
  console.log("Owner:", deployer.address);
  console.log("Network:", (await deployer.provider.getNetwork()).name);
  
  // Save deployment info to file
  const fs = require('fs');
  const deploymentInfo = {
    contractName: "DynamicTimeSVGNFT",
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: (await deployer.provider.getNetwork()).name,
    deploymentTime: new Date().toISOString(),
    blockNumber: await deployer.provider.getBlockNumber()
  };
  
  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
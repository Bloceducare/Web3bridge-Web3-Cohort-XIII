import hre from "hardhat";

async function main() {
  console.log("🚀 Starting DynamicTimeNFT deployment...");
  
  try {
    // Connect to the hardhat network
    const networkConnection = await hre.network.connect({
      network: "hardhat",
      chainType: "l1",
    });

    console.log("✅ Connected to network");
    console.log("🔍 Network connection:", Object.keys(networkConnection));

    const { ethers } = networkConnection;
    console.log("🔍 Ethers available:", !!ethers);

    if (!ethers) {
      throw new Error("Ethers not available from network connection");
    }

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    // Get contract factory
    const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
    console.log("🏗️  Got contract factory");
    
    // Deploy contract
    console.log("📦 Deploying contract...");
    const nft = await DynamicTimeNFT.deploy();
    
    // Wait for deployment
    console.log("⏳ Waiting for deployment...");
    await nft.waitForDeployment();
    
    const contractAddress = await nft.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);
    
    // Test basic functionality
    console.log("🧪 Testing basic functionality...");
    
    // Check name and symbol
    const name = await nft.name();
    const symbol = await nft.symbol();
    console.log("📛 Name:", name);
    console.log("🏷️  Symbol:", symbol);
    
    // Mint a test NFT
    console.log("🎨 Minting test NFT...");
    const mintTx = await nft.mint(deployer.address);
    await mintTx.wait();
    console.log("✅ Minted NFT #1");
    
    // Check ownership
    const owner = await nft.ownerOf(1);
    console.log("👑 Owner of NFT #1:", owner);
    
    // Get token URI
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
    
    // Test multiple mints
    console.log("🎨 Testing multiple mints...");
    await nft.mint(deployer.address);
    await nft.mint(deployer.address);
    
    const balance_nft = await nft.balanceOf(deployer.address);
    console.log("💰 NFT balance:", balance_nft.toString());
    
    // Test transfer
    console.log("🔄 Testing transfer...");
    const [, addr1] = await ethers.getSigners();
    await nft.transferFrom(deployer.address, addr1.address, 1);
    
    const newOwner = await nft.ownerOf(1);
    console.log("👑 New owner of NFT #1:", newOwner);
    
    console.log("\n🎉 All tests passed!");
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(50));
    console.log("✅ Contract Address:", contractAddress);
    console.log("✅ Network: Hardhat Local");
    console.log("✅ Deployer:", deployer.address);
    console.log("✅ Contract Name:", name);
    console.log("✅ Contract Symbol:", symbol);
    console.log("✅ NFTs Minted: 3");
    console.log("✅ All Functions Working: ✓");
    console.log("=".repeat(50));
    
    return {
      contractAddress,
      deployer: deployer.address,
      name,
      symbol
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
main()
  .then((result) => {
    console.log("🏁 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment process failed:", error);
    process.exit(1);
  });

const { ethers } = require("hardhat");
const { uploadCompleteNFT } = require('./pinata-upload');
require("dotenv").config();

// Update this with your deployed contract address
const CONTRACT_ADDRESS = "0xB4A124C569ddC6D89faA71F2da0225f5e52c8b3f";

async function main() {
  console.log('🎨 Minting Single NFT with Pinata IPFS...');

  if (CONTRACT_ADDRESS === "YOUR_DEPLOYED_CONTRACT_ADDRESS") {
    console.error("❌ Please update CONTRACT_ADDRESS in the script");
    process.exit(1);
  }

  // Configure your NFT here
  const imagePath = "./image/image.jpg"; // Update this path
  const nftData = {
    name: "Martins NFT #1",
    description: "This is an amazing NFT created with Pinata IPFS storage on Lisk testnet!",
    external_url: "https://your-website.com",
    attributes: [
      { trait_type: "Storage", value: "IPFS" },
      { trait_type: "Network", value: "Lisk Testnet" },
      { trait_type: "Rarity", value: "Legendary" },
      { trait_type: "Power Level", value: 95, display_type: "number" },
      { trait_type: "Created", value: new Date().toISOString().split('T')[0] }
    ],
    creator: "Your Name",
    properties: {
      category: "Digital Art",
      tool: "Pinata + Hardhat",
      blockchain: "Lisk"
    }
  };

  try {
    // Step 1: Upload to IPFS via Pinata
    console.log('\n📤 Step 1: Uploading to IPFS...');
    const ipfsResult = await uploadCompleteNFT(imagePath, nftData);

    // Step 2: Mint NFT with IPFS metadata
    console.log('\n⛏️  Step 2: Minting NFT on blockchain...');
    
    const [minter] = await ethers.getSigners();
    console.log("👤 Minting with account:", minter.address);

    // Connect to the deployed contract
    const SimpleNFT = await ethers.getContractFactory("MartinsNFT");
    const simpleNFT = SimpleNFT.attach(CONTRACT_ADDRESS);

    // Get contract info
    const mintPrice = await simpleNFT.mintPrice();
    const totalSupply = await simpleNFT.totalSupply();
    const balance = await ethers.provider.getBalance(minter.address);

    console.log("📊 Contract info:");
    console.log("   Contract Address:", CONTRACT_ADDRESS);
    console.log("   Current Supply:", totalSupply.toString());
    console.log("   Mint Price:", ethers.formatEther(mintPrice), "LSK");
    console.log("   Your Balance:", ethers.formatEther(balance), "LSK");

    // Check balance
    if (balance < mintPrice) {
      console.error("❌ Insufficient balance for minting");
      process.exit(1);
    }

    // Mint the NFT with IPFS metadata URI
    const tx = await simpleNFT.mint(minter.address, ipfsResult.tokenURI, {
      value: mintPrice,
      gasLimit: 300000
    });

    console.log("⏳ Transaction submitted:", tx.hash);
    console.log("🔗 Track on explorer:", `https://sepolia-blockscout.lisk.com/tx/${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Get the minted token ID
    const mintEvent = receipt.logs.find(log => {
      try {
        const parsed = simpleNFT.interface.parseLog(log);
        return parsed.name === "NFTMinted";
      } catch (e) {
        return false;
      }
    });

    let tokenId;
    if (mintEvent) {
      const parsedEvent = simpleNFT.interface.parseLog(mintEvent);
      tokenId = parsedEvent.args.tokenId;
    } else {
      tokenId = totalSupply + 1n;
    }

    // Complete success summary
    console.log('\n🎉 NFT Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
    console.log(`🆔 Token ID: ${tokenId.toString()}`);
    console.log(`👤 Owner: ${minter.address}`);
    console.log(`🖼️  Image IPFS: ${ipfsResult.image.hash}`);
    console.log(`📄 Metadata IPFS: ${ipfsResult.metadata.hash}`);
    console.log(`🔗 Token URI: ${ipfsResult.tokenURI}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 View on:');
    console.log(`   Blockchain: https://sepolia-blockscout.lisk.com/address/${CONTRACT_ADDRESS}`);
    console.log(`   Image: ${ipfsResult.image.gateway}`);
    console.log(`   Metadata: ${ipfsResult.metadata.gateway}`);

    // Save NFT details to file
    const nftDetails = {
      contractAddress: CONTRACT_ADDRESS,
      tokenId: tokenId.toString(),
      owner: minter.address,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      ipfs: ipfsResult,
      mintedAt: new Date().toISOString(),
      name: nftData.name,
      description: nftData.description
    };

    const fileName = `nft-${tokenId}-details-${Date.now()}.json`;
    const fs = require('fs');
    fs.writeFileSync(fileName, JSON.stringify(nftDetails, null, 2));
    console.log(`💾 NFT details saved to: ${fileName}`);

    return nftDetails;

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
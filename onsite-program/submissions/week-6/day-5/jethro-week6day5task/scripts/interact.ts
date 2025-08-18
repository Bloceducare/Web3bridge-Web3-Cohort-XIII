import { ethers } from "hardhat";
import { network } from "hardhat";

/**
 * Interaction script for DynamicTimeNFT contract
 * 
 * This script demonstrates how to interact with a deployed DynamicTimeNFT contract.
 * It includes minting, querying metadata, and displaying the dynamic time feature.
 * 
 * Usage:
 * - Local: CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.ts
 * - Sepolia: CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.ts --network sepolia
 */

async function main() {
  console.log("🎮 Starting DynamicTimeNFT interaction...");
  console.log("📡 Network:", network.name);

  // Get contract address from environment
  const contractAddress = process.env.CONTRACT_ADDRESS || "";
  
  if (!contractAddress) {
    console.error("❌ Please provide the contract address:");
    console.log("   CONTRACT_ADDRESS=0x1234... npx hardhat run scripts/interact.ts --network sepolia");
    process.exit(1);
  }

  console.log("📍 Contract Address:", contractAddress);

  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("👤 User1:", user1.address);
  console.log("👤 User2:", user2.address);

  // Connect to the deployed contract
  const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
  const nft = DynamicTimeNFT.attach(contractAddress);

  console.log("\n🔍 Contract Information:");
  console.log("📛 Name:", await nft.name());
  console.log("🏷️  Symbol:", await nft.symbol());

  // Check current balances
  console.log("\n💰 Current Balances:");
  console.log("👤 Deployer balance:", (await nft.balanceOf(deployer.address)).toString());
  console.log("👤 User1 balance:", (await nft.balanceOf(user1.address)).toString());
  console.log("👤 User2 balance:", (await nft.balanceOf(user2.address)).toString());

  // Mint NFTs to different users
  console.log("\n🎨 Minting NFTs...");
  
  // Mint to deployer
  console.log("🎨 Minting NFT to deployer...");
  let tx = await nft.mint(deployer.address);
  let receipt = await tx.wait();
  console.log("✅ Minted NFT, Gas used:", receipt?.gasUsed.toString());

  // Mint to user1
  console.log("🎨 Minting NFT to user1...");
  tx = await nft.mint(user1.address);
  receipt = await tx.wait();
  console.log("✅ Minted NFT, Gas used:", receipt?.gasUsed.toString());

  // Mint to user2
  console.log("🎨 Minting NFT to user2...");
  tx = await nft.mint(user2.address);
  receipt = await tx.wait();
  console.log("✅ Minted NFT, Gas used:", receipt?.gasUsed.toString());

  // Check updated balances
  console.log("\n💰 Updated Balances:");
  console.log("👤 Deployer balance:", (await nft.balanceOf(deployer.address)).toString());
  console.log("👤 User1 balance:", (await nft.balanceOf(user1.address)).toString());
  console.log("👤 User2 balance:", (await nft.balanceOf(user2.address)).toString());

  // Get token owners
  console.log("\n👑 Token Ownership:");
  try {
    for (let i = 1; i <= 3; i++) {
      const owner = await nft.ownerOf(i);
      console.log(`🎫 Token ${i} owned by:`, owner);
    }
  } catch (error) {
    console.log("ℹ️  Some tokens may not exist yet");
  }

  // Display token metadata and time
  console.log("\n🖼️  Token Metadata & Time Display:");
  
  for (let tokenId = 1; tokenId <= 3; tokenId++) {
    try {
      console.log(`\n🎫 Token ${tokenId}:`);
      
      const tokenURI = await nft.tokenURI(tokenId);
      console.log("📄 URI length:", tokenURI.length, "characters");
      
      // Decode metadata
      const json = Buffer.from(tokenURI.split(',')[1], 'base64').toString();
      const metadata = JSON.parse(json);
      
      console.log("📛 Name:", metadata.name);
      console.log("📝 Description:", metadata.description);
      
      // Decode SVG and extract time
      const svg = Buffer.from(metadata.image.split(',')[1], 'base64').toString();
      const timeMatch = svg.match(/(\d{2}:\d{2}:\d{2})/);
      
      if (timeMatch) {
        console.log("🕐 Time displayed:", timeMatch[1]);
      }
      
      // Show SVG dimensions
      const widthMatch = svg.match(/width="(\d+)"/);
      const heightMatch = svg.match(/height="(\d+)"/);
      if (widthMatch && heightMatch) {
        console.log("📐 SVG size:", `${widthMatch[1]}x${heightMatch[1]}`);
      }
      
    } catch (error) {
      console.log(`❌ Error getting metadata for token ${tokenId}:`, error);
    }
  }

  // Demonstrate time changes (if on local network)
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("\n⏰ Demonstrating time changes (local network only)...");
    
    // Get current time display
    const initialURI = await nft.tokenURI(1);
    const initialJson = Buffer.from(initialURI.split(',')[1], 'base64').toString();
    const initialMetadata = JSON.parse(initialJson);
    const initialSvg = Buffer.from(initialMetadata.image.split(',')[1], 'base64').toString();
    const initialTime = initialSvg.match(/(\d{2}:\d{2}:\d{2})/)?.[1];
    
    console.log("🕐 Initial time:", initialTime);
    
    // Advance time by 1 hour (3600 seconds)
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);
    
    // Get updated time display
    const updatedURI = await nft.tokenURI(1);
    const updatedJson = Buffer.from(updatedURI.split(',')[1], 'base64').toString();
    const updatedMetadata = JSON.parse(updatedJson);
    const updatedSvg = Buffer.from(updatedMetadata.image.split(',')[1], 'base64').toString();
    const updatedTime = updatedSvg.match(/(\d{2}:\d{2}:\d{2})/)?.[1];
    
    console.log("🕐 Updated time:", updatedTime);
    console.log("✅ Time display updated successfully!");
  }

  // Test ERC721 functionality
  console.log("\n🔄 Testing ERC721 Transfers...");
  
  // Approve user2 to transfer token 1 from deployer
  console.log("✅ Approving user2 to transfer token 1...");
  tx = await nft.approve(user2.address, 1);
  await tx.wait();
  
  const approved = await nft.getApproved(1);
  console.log("👤 Token 1 approved for:", approved);
  
  // Transfer token 1 from deployer to user2
  console.log("🔄 Transferring token 1 from deployer to user2...");
  const nftAsUser2 = nft.connect(user2);
  tx = await nftAsUser2.transferFrom(deployer.address, user2.address, 1);
  await tx.wait();
  
  console.log("✅ Transfer completed!");
  console.log("👑 Token 1 new owner:", await nft.ownerOf(1));

  // Final balances
  console.log("\n💰 Final Balances:");
  console.log("👤 Deployer balance:", (await nft.balanceOf(deployer.address)).toString());
  console.log("👤 User1 balance:", (await nft.balanceOf(user1.address)).toString());
  console.log("👤 User2 balance:", (await nft.balanceOf(user2.address)).toString());

  console.log("\n🎉 Interaction completed successfully!");
}

// Execute the interaction
main()
  .then(() => {
    console.log("🏁 Interaction script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Interaction script failed:", error);
    process.exit(1);
  });

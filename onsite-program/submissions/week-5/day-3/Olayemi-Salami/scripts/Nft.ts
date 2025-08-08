const { ethers } = require("hardhat");

async function main() {
  // Your deployed contract address
  const CONTRACT_ADDRESS = "0xf5879ef24Ab717e1EfBaa6DfAce3abCeAC2a2258";
  
  // Your wallet address (recipient)
  const RECIPIENT_ADDRESS = "0xB6F2Bd41cA5BaDC0a8e1Ed5Dd5dD44BC99fe11B0";
  
  // Your metadata hash from Pinata
  const METADATA_URI = "ipfs://bafkreif47s5bbcc7e6mnq3iwyeetqly6h66lqd43azsxekw5o6b2p33zki";
  // Get contract instance
  const ERC721 = await ethers.getContractFactory("Nft");
  const contract = ERC721.attach(CONTRACT_ADDRESS);
  
  console.log("Minting NFT...");
  
  // Call mint function
  const tx = await contract.mint(RECIPIENT_ADDRESS, METADATA_URI);
  
  console.log("Transaction submitted:", tx.hash);
  
  // Wait for transaction to be mined
  await tx.wait();
  
  console.log("NFT minted successfully!");
  console.log("Check OpenSea in a few minutes for your NFT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
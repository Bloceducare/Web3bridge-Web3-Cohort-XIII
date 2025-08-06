const { ethers } = require("hardhat");

async function main() {
  // Your deployed contract address
  const CONTRACT_ADDRESS = "0xd23329263c344a1d1AFC3140E2F5d1F0AA5d60D9";
  
  // Your wallet address (recipient)
  const RECIPIENT_ADDRESS = "0x1Ff9eA9F062C31cfF19Ade558E34894f07Cf7817";
  
  // Your metadata hash from Pinata
  const METADATA_URI = "ipfs://bafkreihpvs2fiyck7hjhcbq4sj6lsa2fh7eium6n23ir5mitneqrfkmrnu";
  
  // Get contract instance
  const DEERNFT = await ethers.getContractFactory("DEERNFT");
  const contract = DEERNFT.attach(CONTRACT_ADDRESS);
  
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
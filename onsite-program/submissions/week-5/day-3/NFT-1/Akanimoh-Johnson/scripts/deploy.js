const { ethers } = require("hardhat");
// import { ethers } from "hardhat";

async function main() {
  // Replace with your Pinata CID for the NFT metadata
  const tokenURI = "ipfs://bafkreibd2eo2wu5evrdumfezlw7spy7gc3ib4t5jwthxo5l527opzqaoja"; // e.g., ipfs://Qm...xyz
  // Replace with the recipient address for the NFT
  const recipient = "0x58C25c26666B31241C67Cf7B9a82e325eB07c342"; // e.g., 0x123...abc

  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Deploy the TomiNFT contract
  const TomiNFT = await ethers.getContractFactory("TomiNFT");
  const tomiNFT = await TomiNFT.deploy(deployer.address);
  await tomiNFT.waitForDeployment();
  console.log("TomiNFT deployed to:", await tomiNFT.getAddress());

  // Mint one NFT
  const tx = await tomiNFT.mintNFT(recipient, tokenURI);
  const receipt = await tx.wait();
  console.log("NFT minted with token ID 1 to:", recipient);
  console.log("Transaction hash:", receipt.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
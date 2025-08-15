import { ethers } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
  const nft = await DynamicTimeNFT.deploy();
  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();
  console.log("DynamicTimeNFT deployed to:", contractAddress);

  // Mint a test NFT
  const tx = await nft.mint(deployer.address);
  await tx.wait();
  console.log("Minted NFT ID 1 to:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
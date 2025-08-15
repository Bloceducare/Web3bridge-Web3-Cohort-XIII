import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying DynamicTimeNFT...");

  const NFT = await ethers.getContractFactory("DynamicTimeNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();

  const nftAddress = await nft.getAddress();
  console.log(`✅ DynamicTimeNFT deployed to: ${nftAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

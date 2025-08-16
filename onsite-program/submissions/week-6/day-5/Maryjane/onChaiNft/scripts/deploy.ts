import { ethers } from "hardhat";

async function main() {
  // Get the contract factory
  const OnChaiNft = await ethers.getContractFactory("OnChaiNft");

  // Deploy the contract
  const nft = await OnChaiNft.deploy();
  await nft.waitForDeployment();

  // Print the deployed address
  console.log("OnChaiNft deployed to:", await nft.getAddress());
}

// Run the deploy script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

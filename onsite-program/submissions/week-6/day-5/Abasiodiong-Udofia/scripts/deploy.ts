import { ethers } from "hardhat";

async function main() {
  const ChakraTimeNFT = await ethers.getContractFactory("ChakraTimeNFT");
  const nft = await ChakraTimeNFT.deploy();
  await nft.waitForDeployment();
  console.log("ChakraTimeNFT deployed to:", await nft.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
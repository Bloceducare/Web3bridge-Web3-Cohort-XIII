import { ethers } from "hardhat";

async function main(): Promise<void> {
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy("ipfs://bafkreiasoxifi73x5eisgkecpmuh74sppyvysqkdeysase5rk7i2mlsrnq/");
  await myNFT.deployed();
  console.log("MyNFT deployed to:", myNFT.address);
}

main().catch((error: Error) => {
  console.error(error);
  process.exitCode = 1);
});
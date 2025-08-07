import { ethers } from "hardhat";

async function main() {
  const MOSASNFT = await ethers.getContractFactory("MOSASNFT");
  const moNFT = await MOSASNFT.deploy();
  await moNFT.waitForDeployment();
  console.log("MOSASNFT deployed to:", await moNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
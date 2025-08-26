import { ethers } from "hardhat";

async function main() {
  const ChakraMembershipNFT = await ethers.getContractFactory("ChakraMembershipNFT");
  const nft = await ChakraMembershipNFT.deploy();
  await nft.waitForDeployment();
  console.log("ChakraMembershipNFT deployed to:", await nft.getAddress());

  const ChakraRoleRegistry = await ethers.getContractFactory("ChakraRoleRegistry");
  const registry = await ChakraRoleRegistry.deploy();
  await registry.waitForDeployment();
  console.log("ChakraRoleRegistry deployed to:", await registry.getAddress());

  const ChakraDAO = await ethers.getContractFactory("ChakraDAO");
  const dao = await ChakraDAO.deploy(await nft.getAddress(), await registry.getAddress());
  await dao.waitForDeployment();
  console.log("ChakraDAO deployed to:", await dao.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
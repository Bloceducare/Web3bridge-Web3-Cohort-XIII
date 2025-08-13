import { ethers } from "hardhat";

async function main() {

  const MockRegistry = await ethers.getContractFactory("MockRolesRegistry");
  const registry = await MockRegistry.deploy();
  await registry.waitForDeployment();
  console.log("Registry:", await registry.getAddress());

 
  const NFT = await ethers.getContractFactory("MembershipNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  console.log("NFT:", await nft.getAddress());


  const DAO = await ethers.getContractFactory("TokenGatedDAO");
  const dao = await DAO.deploy(await registry.getAddress());
  await dao.waitForDeployment();
  console.log("DAO:", await dao.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

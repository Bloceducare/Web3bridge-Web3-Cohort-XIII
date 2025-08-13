import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const NFT = await ethers.getContractFactory("GovernanceNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();

  const Roles = await ethers.getContractFactory("BasicRolesRegistry");
  const roles = await Roles.deploy();
  await roles.waitForDeployment();

  const DAO = await ethers.getContractFactory("RoleGatedDAO");
  const dao = await DAO.deploy(await roles.getAddress(), await nft.getAddress());
  await dao.waitForDeployment();

  const tx = await nft.mint(deployer.address);
  await tx.wait();

  console.log("NFT:", await nft.getAddress());
  console.log("RolesRegistry:", await roles.getAddress());
  console.log("DAO:", await dao.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

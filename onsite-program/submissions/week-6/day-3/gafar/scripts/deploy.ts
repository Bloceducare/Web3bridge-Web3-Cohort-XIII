import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying RoleNFT...");

  // Deploy NFT contract
  const RoleNFT = await ethers.getContractFactory("RoleBasedNFT");
  const roleNft = await RoleNFT.deploy("RoleNFT", "RNFT");
  await roleNft.waitForDeployment();

  const roleNftAddress = await roleNft.getAddress();
  console.log(`✅ RoleNFT deployed at: ${roleNftAddress}`);

  console.log("🚀 Deploying RoleGatedDAO...");

  // Deploy DAO contract with RoleNFT address
  const RoleGatedDAO = await ethers.getContractFactory("RoleGatedDAO");
  const dao = await RoleGatedDAO.deploy(roleNftAddress);
  await dao.waitForDeployment();

  const daoAddress = await dao.getAddress();
  console.log(`✅ RoleGatedDAO deployed at: ${daoAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

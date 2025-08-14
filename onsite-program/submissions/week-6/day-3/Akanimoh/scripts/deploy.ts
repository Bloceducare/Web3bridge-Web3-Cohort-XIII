import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MembershipNFT
  const MembershipNFT = await ethers.getContractFactory("MembershipNFT");
  const membershipNFT = await MembershipNFT.deploy();
  await membershipNFT.waitForDeployment();
  console.log("MembershipNFT deployed to:", await membershipNFT.getAddress());

  // Deploy RolesRegistry
  const RolesRegistry = await ethers.getContractFactory("RolesRegistry");
  const rolesRegistry = await RolesRegistry.deploy();
  await rolesRegistry.waitForDeployment();
  console.log("RolesRegistry deployed to:", await rolesRegistry.getAddress());

  // Deploy TokenGatedDAO
  const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
  const dao = await TokenGatedDAO.deploy(
    await membershipNFT.getAddress(),
    await rolesRegistry.getAddress()
  );
  await dao.waitForDeployment();
  console.log("TokenGatedDAO deployed to:", await dao.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
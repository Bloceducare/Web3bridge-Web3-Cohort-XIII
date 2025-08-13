const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MembershipNFT
  const MembershipNFT = await hre.ethers.getContractFactory("MembershipNFT");
  const membershipNFT = await MembershipNFT.deploy();
  await membershipNFT.waitForDeployment();
  console.log("MembershipNFT deployed to:", membershipNFT.target);

  // Deploy RolesRegistry
  const RolesRegistry = await hre.ethers.getContractFactory("RolesRegistry");
  const rolesRegistry = await RolesRegistry.deploy();
  await rolesRegistry.waitForDeployment();
  console.log("RolesRegistry deployed to:", rolesRegistry.target);

  // Deploy TokenGatedDAO
  const TokenGatedDAO = await hre.ethers.getContractFactory("TokenGatedDAO");
  const dao = await TokenGatedDAO.deploy(membershipNFT.target, rolesRegistry.target);
  await dao.waitForDeployment();
  console.log("TokenGatedDAO deployed to:", dao.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
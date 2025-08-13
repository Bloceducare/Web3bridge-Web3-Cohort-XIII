import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1️⃣ Deploy MembershipNFT
  const MembershipNFTFactory = await ethers.getContractFactory("MembershipNFT");
  const membershipNFT = await MembershipNFTFactory.deploy();
  await membershipNFT.waitForDeployment();
  console.log("MembershipNFT deployed to:", await membershipNFT.getAddress());

  // 2️⃣ Deploy RolesRegistry7432
  const RolesRegistryFactory = await ethers.getContractFactory("RolesRegistry7432");
  const rolesRegistry = await RolesRegistryFactory.deploy();
  await rolesRegistry.waitForDeployment();
  console.log("RolesRegistry7432 deployed to:", await rolesRegistry.getAddress());

  // 3️⃣ Deploy DAO
  const DAOFactory = await ethers.getContractFactory("DAO");
  const dao = await DAOFactory.deploy(
    await membershipNFT.getAddress(),
    await rolesRegistry.getAddress()
  );
  await dao.waitForDeployment();
  console.log("DAO deployed to:", await dao.getAddress());

  // 4️⃣ Mint NFT to deployer (tokenId = 1)
  console.log("Minting NFT to deployer...");
  await membershipNFT.mint(deployer.address);

  // 5️⃣ Assign VOTER role to NFT tokenId = 1
  const voterRole = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
  const roleStruct = {
    roleId: voterRole,
    tokenAddress: await membershipNFT.getAddress(),
    tokenId: 1,
    recipient: deployer.address,
    expirationDate: 0,
    revocable: true,
    data: ethers.toUtf8Bytes("can vote")
  };
  console.log("Granting VOTER role to deployer...");
  await rolesRegistry.connect(deployer).grantRole(roleStruct);

  // 6️⃣ Verify role in DAO
  const hasVotingRights = await dao.connect(deployer).hasVotingRights(deployer.address);
  console.log(`Deployer has voting rights: ${hasVotingRights}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

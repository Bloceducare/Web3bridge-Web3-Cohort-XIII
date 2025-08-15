import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy RoleNFT
  const RoleNFT = await ethers.getContractFactory("RoleNFT");
  const roleNFT = await RoleNFT.deploy();
  await roleNFT.waitForDeployment();
  console.log("RoleNFT deployed to:", await roleNFT.getAddress());

  // Deploy TokenGatedDAO
  const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
  const dao = await TokenGatedDAO.deploy(await roleNFT.getAddress());
  await dao.waitForDeployment();
  console.log("TokenGatedDAO deployed to:", await dao.getAddress());

  // Set DAO contract address in RoleNFT for efficient role checking
  await roleNFT.setDAOContract(await dao.getAddress());
  console.log("DAO contract address set in RoleNFT");

  // Setup initial roles
  console.log("\nSetting up initial roles...");
  
  const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER_ROLE"));
  const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE"));
  const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));

  // Mint NFTs for demonstration
  await roleNFT.mint(deployer.address);
  await roleNFT.mint(deployer.address);
  await roleNFT.mint(deployer.address);

  const futureTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year

  // Grant roles to deployer for demonstration
  await roleNFT.grantRole(VOTER_ROLE, 0, deployer.address, futureTime, true, "0x");
  await roleNFT.grantRole(PROPOSER_ROLE, 1, deployer.address, futureTime, true, "0x");
  await roleNFT.grantRole(EXECUTOR_ROLE, 2, deployer.address, futureTime, true, "0x");

  console.log("Initial roles granted to deployer");
  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
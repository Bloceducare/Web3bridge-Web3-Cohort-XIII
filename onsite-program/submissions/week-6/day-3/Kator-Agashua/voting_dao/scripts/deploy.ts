// scripts/deploy.js
const { ethers } = require("hardhat");
const { keccak256, toUtf8Bytes, parseEther, formatEther } = require("ethers");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy RoleNFT first
  console.log("\n=== Deploying RoleNFT ===");
  const RoleNFT = await ethers.getContractFactory("RoleNFT");
  const roleNFT = await RoleNFT.deploy(deployer.address); // deployer is initial owner
  await roleNFT.waitForDeployment();
  const roleNFTAddress = await roleNFT.getAddress();
  console.log("RoleNFT deployed to:", roleNFTAddress);
  console.log("RoleNFT owner:", await roleNFT.owner());

  // 2. Deploy DAO with RoleNFT address
  console.log("\n=== Deploying DAO ===");
  const DAO = await ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(roleNFTAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("DAO deployed to:", daoAddress);
  console.log("DAO RoleNFT address:", await dao.roleNFT());

  // 3. Optional: Setup initial roles
  console.log("\n=== Setting up initial roles ===");
  
  // Define role constants (same as in contract)
  const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN"));
  const VOTER_ROLE = keccak256(toUtf8Bytes("VOTER"));
  const MEMBER_ROLE = keccak256(toUtf8Bytes("MEMBER"));
  const TREASURER_ROLE = keccak256(toUtf8Bytes("TREASURER"));
  
  console.log("Role IDs:");
  console.log("ADMIN_ROLE:", ADMIN_ROLE);
  console.log("VOTER_ROLE:", VOTER_ROLE);
  console.log("MEMBER_ROLE:", MEMBER_ROLE);
  console.log("TREASURER_ROLE:", TREASURER_ROLE);

  // Mint NFTs for role assignment (optional)
  console.log("\n=== Minting NFTs ===");
  
  // Mint NFT to deployer for admin role
  const mintTx1 = await roleNFT.mint(deployer.address);
  await mintTx1.wait();
  console.log("NFT minted to deployer for admin role");
  
  // Get the token ID (assuming it's 1 since it's the first mint)
  const tokenId = 1;
  
  // Assign admin role to deployer
  const expirationDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now
  const assignRoleTx = await roleNFT.assignRole(
    ADMIN_ROLE,
    tokenId,
    deployer.address,
    expirationDate,
    true // revocable
  );
  await assignRoleTx.wait();
  console.log("Admin role assigned to deployer");

  // Verify role assignment
  const hasAdminRole = await roleNFT.hasRole(deployer.address, ADMIN_ROLE);
  console.log("Deployer has admin role:", hasAdminRole);

  // 4. Optional: Fund the DAO with some ETH
  console.log("\n=== Funding DAO ===");
  const fundAmount = parseEther("1.0"); // 1 ETH
  const fundTx = await deployer.sendTransaction({
    to: daoAddress,
    value: fundAmount
  });
  await fundTx.wait();
  
  const daoBalance = await dao.getDAOBalance();
  console.log("DAO balance:", formatEther(daoBalance), "ETH");

  // 5. Summary
  console.log("\n=== Deployment Summary ===");
  console.log("RoleNFT Address:", roleNFT.address);
  console.log("DAO Address:", dao.address);
  console.log("Network:", await ethers.provider.getNetwork());
  console.log("Deployer:", deployer.address);
  
  // Save addresses for verification
  console.log("\n=== For Verification ===");
  console.log(`npx hardhat verify --network <network> ${roleNFT.address} "${deployer.address}"`);
  console.log(`npx hardhat verify --network <network> ${dao.address} "${roleNFT.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
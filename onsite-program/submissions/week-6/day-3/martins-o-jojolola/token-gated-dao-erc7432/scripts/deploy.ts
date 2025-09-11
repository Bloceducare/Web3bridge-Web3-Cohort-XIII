import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Token-Gated DAO with ERC-7432 Roles...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy RoleBasedNFT first
  console.log("\n📝 Deploying RoleBasedNFT...");
  const RoleBasedNFT = await ethers.getContractFactory("RoleBasedNFT");
  const roleBasedNFT = await RoleBasedNFT.deploy("DAO Membership NFT", "DAONFT");
  await roleBasedNFT.waitForDeployment();
  
  const nftAddress = await roleBasedNFT.getAddress();
  console.log("RoleBasedNFT deployed to:", nftAddress);

  // Deploy TokenGatedDAO
  console.log("\n🏛️ Deploying TokenGatedDAO...");
  const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
  const tokenGatedDAO = await TokenGatedDAO.deploy(nftAddress);
  await tokenGatedDAO.waitForDeployment();
  
  const daoAddress = await tokenGatedDAO.getAddress();
  console.log("TokenGatedDAO deployed to:", daoAddress);

  // Setup initial roles and memberships
  console.log("\n⚙️ Setting up initial roles...");
  
  // Mint NFTs to deployer and setup roles
  console.log("Minting NFT to deployer...");
  const mintTx = await roleBasedNFT.mint(deployer.address);
  await mintTx.wait();
  
  const tokenId = 0; // First minted token
  
  // Grant all roles to the deployer for the first NFT
  const roles = [
    await roleBasedNFT.DAO_MEMBER_ROLE(),
    await roleBasedNFT.DAO_ADMIN_ROLE(),
    await roleBasedNFT.PROPOSAL_CREATOR_ROLE(),
    await roleBasedNFT.VOTER_ROLE()
  ];
  
  const roleNames = ["DAO_MEMBER_ROLE", "DAO_ADMIN_ROLE", "PROPOSAL_CREATOR_ROLE", "VOTER_ROLE"];
  
  for (let i = 0; i < roles.length; i++) {
    console.log(`Granting ${roleNames[i]} to deployer...`);
    const grantTx = await roleBasedNFT.grantRole(
      roles[i],
      tokenId,
      deployer.address,
      0, // No expiration
      true, // Revocable
      "0x" // No additional data
    );
    await grantTx.wait();
  }

  // Verify role assignments
  console.log("\n✅ Verifying role assignments...");
  for (let i = 0; i < roles.length; i++) {
    const hasRole = await roleBasedNFT.hasRole(roles[i], tokenId, deployer.address);
    console.log(`${roleNames[i]}: ${hasRole}`);
  }

  // Verify DAO permissions
  console.log("\n🔍 Verifying DAO permissions...");
  console.log("Is member:", await tokenGatedDAO.isMember(deployer.address));
  console.log("Is admin:", await tokenGatedDAO.isAdmin(deployer.address));
  console.log("Can create proposal:", await tokenGatedDAO.canCreateProposal(deployer.address));
  console.log("Can vote:", await tokenGatedDAO.canVote(deployer.address));
  console.log("Voting power:", await tokenGatedDAO.getVotingPower(deployer.address));

  console.log("\n🎉 Deployment completed successfully!");
  console.log("=====================================");
  console.log("Contract Addresses:");
  console.log("RoleBasedNFT:", nftAddress);
  console.log("TokenGatedDAO:", daoAddress);
  console.log("=====================================");
  
  // Save deployment addresses to a file
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      RoleBasedNFT: nftAddress,
      TokenGatedDAO: daoAddress
    },
    timestamp: new Date().toISOString()
  };
  
  const fs = require('fs');
  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to deployment.json");
}

// Handle deployment errors
main().catch((error) => {
  console.error("❌ Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});

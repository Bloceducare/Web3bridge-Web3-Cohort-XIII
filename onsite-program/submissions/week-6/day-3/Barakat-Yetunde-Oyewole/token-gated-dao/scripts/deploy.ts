import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Token-Gated DAO contracts...");

  const DAOMembershipNFT = await ethers.getContractFactory("DAOMembershipNFT");
  const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");

  console.log("Deploying DAOMembershipNFT...");
  const membershipNFT = await DAOMembershipNFT.deploy();
  await membershipNFT.waitForDeployment();
  console.log(`DAOMembershipNFT deployed to: ${await membershipNFT.getAddress()}`);

  console.log("Deploying TokenGatedDAO...");
  const dao = await TokenGatedDAO.deploy(await membershipNFT.getAddress());
  await dao.waitForDeployment();
  console.log(`TokenGatedDAO deployed to: ${await dao.getAddress()}`);

  const signers = await ethers.getSigners();
  const [owner] = signers;
  console.log(`Owner address: ${owner.address}`);
  console.log(`Available signers: ${signers.length}`);


  if (signers.length === 1) {
    console.log("\n=== Single Signer Deployment (Live Network) ===");
    console.log("Contracts deployed successfully!");
    console.log("To use the DAO:");
    console.log("1. Mint NFTs to users using: membershipNFT.mintMembership(userAddress, tokenURI)");
    console.log("2. Grant roles using: membershipNFT.grantDAORole(role, tokenId, userAddress, expiry)");
    
    console.log("\n=== Deployment Summary ===");
    console.log(`DAOMembershipNFT: ${await membershipNFT.getAddress()}`);
    console.log(`TokenGatedDAO: ${await dao.getAddress()}`);
    console.log(`Deployed by: ${owner.address}`);
    return;
  }

  const [, user1, user2, user3] = signers;
  console.log(`User1 address: ${user1.address}`);
  console.log(`User2 address: ${user2.address}`);
  console.log(`User3 address: ${user3.address}`);

  console.log("\nMinting membership NFTs...");
  
  await membershipNFT.mintMembership(user1.address, "https://example.com/metadata/1");
  console.log(`Minted NFT #0 to ${user1.address}`);

  await membershipNFT.mintMembership(user2.address, "https://example.com/metadata/2");
  console.log(`Minted NFT #1 to ${user2.address}`);

  await membershipNFT.mintMembership(user3.address, "https://example.com/metadata/3");
  console.log(`Minted NFT #2 to ${user3.address}`);

  console.log("\nGranting roles to users...");
  
  const adminRole = await membershipNFT.ADMIN_ROLE();
  await membershipNFT.grantDAORole(adminRole, 0, user1.address, 0); 
  console.log(`Granted ADMIN_ROLE to ${user1.address} for token #0`);

  const proposerRole = await membershipNFT.PROPOSER_ROLE();
  const voterRole = await membershipNFT.VOTER_ROLE();
  await membershipNFT.grantDAORole(proposerRole, 0, user1.address, 0);
  await membershipNFT.grantDAORole(voterRole, 0, user1.address, 0);
  console.log(`Granted PROPOSER_ROLE and VOTER_ROLE to ${user1.address} for token #0`);

  await membershipNFT.grantDAORole(voterRole, 1, user2.address, 0);
  console.log(`Granted VOTER_ROLE to ${user2.address} for token #1`);

  const executorRole = await membershipNFT.EXECUTOR_ROLE();
  await membershipNFT.grantDAORole(executorRole, 2, user3.address, 0);
  await membershipNFT.grantDAORole(voterRole, 2, user3.address, 0);
  console.log(`Granted EXECUTOR_ROLE and VOTER_ROLE to ${user3.address} for token #2`);

  console.log("\nVerifying roles...");
  
  const user1HasAdmin = await membershipNFT.hasRole(adminRole, 0, user1.address);
  const user1HasProposer = await membershipNFT.hasRole(proposerRole, 0, user1.address);
  const user1HasVoter = await membershipNFT.hasRole(voterRole, 0, user1.address);
  console.log(`User1 - Admin: ${user1HasAdmin}, Proposer: ${user1HasProposer}, Voter: ${user1HasVoter}`);

  const user2HasVoter = await membershipNFT.hasRole(voterRole, 1, user2.address);
  console.log(`User2 - Voter: ${user2HasVoter}`);

  const user3HasExecutor = await membershipNFT.hasRole(executorRole, 2, user3.address);
  const user3HasVoter = await membershipNFT.hasRole(voterRole, 2, user3.address);
  console.log(`User3 - Executor: ${user3HasExecutor}, Voter: ${user3HasVoter}`);

  console.log("\n=== Deployment Summary ===");
  console.log(`DAOMembershipNFT: ${await membershipNFT.getAddress()}`);
  console.log(`TokenGatedDAO: ${await dao.getAddress()}`);
  console.log("=== Role Assignments ===");
  console.log(`${user1.address} (Token #0): ADMIN, PROPOSER, VOTER`);
  console.log(`${user2.address} (Token #1): VOTER`);
  console.log(`${user3.address} (Token #2): EXECUTOR, VOTER`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

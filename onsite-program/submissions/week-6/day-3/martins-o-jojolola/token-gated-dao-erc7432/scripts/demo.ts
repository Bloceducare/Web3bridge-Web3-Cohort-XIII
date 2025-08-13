import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Token-Gated DAO with ERC-7432 Demo");
  
  // Get signers
  const [deployer, alice, bob, charlie] = await ethers.getSigners();
  
  console.log("\n👥 Participants:");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Alice: ${alice.address}`);
  console.log(`Bob: ${bob.address}`);
  console.log(`Charlie: ${charlie.address}`);
  
  // Deploy contracts
  console.log("\n📝 Deploying contracts...");
  
  const RoleBasedNFT = await ethers.getContractFactory("RoleBasedNFT");
  const roleBasedNFT = await RoleBasedNFT.deploy("DAO Membership NFT", "DAONFT");
  await roleBasedNFT.waitForDeployment();
  
  const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
  const tokenGatedDAO = await TokenGatedDAO.deploy(await roleBasedNFT.getAddress());
  await tokenGatedDAO.waitForDeployment();
  
  console.log(`✅ RoleBasedNFT deployed to: ${await roleBasedNFT.getAddress()}`);
  console.log(`✅ TokenGatedDAO deployed to: ${await tokenGatedDAO.getAddress()}`);
  
  // Get role constants
  const DAO_MEMBER_ROLE = await roleBasedNFT.DAO_MEMBER_ROLE();
  const DAO_ADMIN_ROLE = await roleBasedNFT.DAO_ADMIN_ROLE();
  const PROPOSAL_CREATOR_ROLE = await roleBasedNFT.PROPOSAL_CREATOR_ROLE();
  const VOTER_ROLE = await roleBasedNFT.VOTER_ROLE();
  
  console.log("\n🔐 Role identifiers:");
  console.log(`DAO_MEMBER_ROLE: ${DAO_MEMBER_ROLE}`);
  console.log(`DAO_ADMIN_ROLE: ${DAO_ADMIN_ROLE}`);
  console.log(`PROPOSAL_CREATOR_ROLE: ${PROPOSAL_CREATOR_ROLE}`);
  console.log(`VOTER_ROLE: ${VOTER_ROLE}`);
  
  // === Setup Phase ===
  console.log("\n⚙️ Setup Phase: Minting NFTs and Assigning Roles");
  
  // Mint NFTs to all users
  await roleBasedNFT.mint(deployer.address); // Token 0
  await roleBasedNFT.mint(alice.address);    // Token 1  
  await roleBasedNFT.mint(bob.address);      // Token 2
  await roleBasedNFT.mint(charlie.address);  // Token 3
  
  console.log(`✅ Minted ${await roleBasedNFT.totalSupply()} NFTs`);
  
  // Assign different role combinations to demonstrate granular permissions
  
  // Deployer: All roles (founder/admin)
  await roleBasedNFT.grantRole(DAO_MEMBER_ROLE, 0, deployer.address, 0, true, "0x");
  await roleBasedNFT.grantRole(DAO_ADMIN_ROLE, 0, deployer.address, 0, true, "0x");
  await roleBasedNFT.grantRole(PROPOSAL_CREATOR_ROLE, 0, deployer.address, 0, true, "0x");
  await roleBasedNFT.grantRole(VOTER_ROLE, 0, deployer.address, 0, true, "0x");
  
  // Alice: Active contributor (member + creator + voter)
  await roleBasedNFT.grantRole(DAO_MEMBER_ROLE, 1, alice.address, 0, true, "0x");
  await roleBasedNFT.grantRole(PROPOSAL_CREATOR_ROLE, 1, alice.address, 0, true, "0x");
  await roleBasedNFT.grantRole(VOTER_ROLE, 1, alice.address, 0, true, "0x");
  
  // Bob: Regular member (member + voter only)
  await roleBasedNFT.grantRole(DAO_MEMBER_ROLE, 2, bob.address, 0, true, "0x");
  await roleBasedNFT.grantRole(VOTER_ROLE, 2, bob.address, 0, true, "0x");
  
  // Charlie: Limited participant (voter only, no membership)
  await roleBasedNFT.grantRole(VOTER_ROLE, 3, charlie.address, 0, true, "0x");
  
  console.log("✅ Role assignments completed");
  
  // Verify permissions
  console.log("\n🔍 Permission Verification:");
  const users = [
    { name: "Deployer", signer: deployer },
    { name: "Alice", signer: alice },
    { name: "Bob", signer: bob },
    { name: "Charlie", signer: charlie }
  ];
  
  for (const user of users) {
    const isMember = await tokenGatedDAO.isMember(user.signer.address);
    const isAdmin = await tokenGatedDAO.isAdmin(user.signer.address);
    const canCreateProposal = await tokenGatedDAO.canCreateProposal(user.signer.address);
    const canVote = await tokenGatedDAO.canVote(user.signer.address);
    const votingPower = await tokenGatedDAO.getVotingPower(user.signer.address);
    
    console.log(`${user.name}: Member=${isMember}, Admin=${isAdmin}, Creator=${canCreateProposal}, Voter=${canVote}, Power=${votingPower}`);
  }
  
  // === Governance Phase ===
  console.log("\n🗳️ Governance Phase: Creating and Voting on Proposals");
  
  // Alice creates a proposal
  console.log("\n📋 Alice creates a funding proposal...");
  await tokenGatedDAO.connect(alice).propose(
    "Treasury Allocation for Marketing",
    "Allocate 2 ETH from the DAO treasury to fund a comprehensive marketing campaign to increase community awareness and adoption."
  );
  
  const proposalId = 0;
  const proposal = await tokenGatedDAO.getProposal(proposalId);
  console.log(`✅ Proposal ${proposalId} created: "${proposal.title}"`);
  console.log(`Description: ${proposal.description}`);
  
  // Fast forward to voting period
  console.log("\n⏳ Fast forwarding to voting period...");
  await ethers.provider.send("evm_increaseTime", [86401]); // 1 day + 1 second
  await ethers.provider.send("evm_mine", []);
  
  console.log(`Proposal state: ${await getProposalStateName(await tokenGatedDAO.getProposalState(proposalId))}`);
  
  // Everyone votes
  console.log("\n🗳️ Voting begins...");
  
  await tokenGatedDAO.connect(deployer).castVote(proposalId, 1, "Support marketing expansion");
  console.log(`✅ Deployer voted FOR`);
  
  await tokenGatedDAO.connect(alice).castVote(proposalId, 1, "My own proposal - let's do this!");
  console.log(`✅ Alice voted FOR`);
  
  await tokenGatedDAO.connect(bob).castVote(proposalId, 1, "Good for community growth");
  console.log(`✅ Bob voted FOR`);
  
  await tokenGatedDAO.connect(charlie).castVote(proposalId, 0, "Too much money for unproven strategy");
  console.log(`✅ Charlie voted AGAINST`);
  
  // Check voting results
  const votingResults = await tokenGatedDAO.getProposal(proposalId);
  console.log(`\n📊 Voting Results:`);
  console.log(`FOR: ${votingResults.forVotes} votes`);
  console.log(`AGAINST: ${votingResults.againstVotes} votes`);
  console.log(`ABSTAIN: ${votingResults.abstainVotes} votes`);
  
  // Fast forward past voting period
  console.log("\n⏰ Fast forwarding past voting period...");
  await ethers.provider.send("evm_increaseTime", [259201]); // 3 days + 1 second
  await ethers.provider.send("evm_mine", []);
  
  const finalState = await tokenGatedDAO.getProposalState(proposalId);
  console.log(`Final proposal state: ${await getProposalStateName(finalState)}`);
  
  // Execute if successful
  if (finalState === 4) { // Succeeded
    console.log("\n🚀 Executing proposal...");
    await tokenGatedDAO.connect(deployer).executeProposal(proposalId); // Admin executes
    console.log(`✅ Proposal executed successfully!`);
    console.log(`New state: ${await getProposalStateName(await tokenGatedDAO.getProposalState(proposalId))}`);
  }
  
  // === Treasury Management Demo ===
  console.log("\n💰 Treasury Management Demo");
  
  // Send ETH to DAO treasury
  console.log("Funding DAO treasury with 5 ETH...");
  await deployer.sendTransaction({
    to: await tokenGatedDAO.getAddress(),
    value: ethers.parseEther("5.0")
  });
  
  const treasuryBalance = await ethers.provider.getBalance(await tokenGatedDAO.getAddress());
  console.log(`✅ Treasury balance: ${ethers.formatEther(treasuryBalance)} ETH`);
  
  // Admin withdraws some funds
  console.log("Admin withdrawing 0.5 ETH for operational expenses...");
  await tokenGatedDAO.connect(deployer).withdrawFromTreasury(
    deployer.address, 
    ethers.parseEther("0.5")
  );
  
  const newBalance = await ethers.provider.getBalance(await tokenGatedDAO.getAddress());
  console.log(`✅ Remaining treasury: ${ethers.formatEther(newBalance)} ETH`);
  
  // === Role Management Demo ===
  console.log("\n🔄 Role Management Demo");
  
  // Grant temporary admin role to Alice (use block timestamp + buffer)
  const latestBlock = await ethers.provider.getBlock('latest');
  const oneHourLater = latestBlock!.timestamp + 3600;
  console.log("Granting temporary admin role to Alice (1 hour expiration)...");
  await roleBasedNFT.grantRole(
    DAO_ADMIN_ROLE,
    1, // Alice's token
    alice.address,
    oneHourLater,
    true, // revocable
    ethers.toUtf8Bytes("Temporary admin for proposal execution")
  );
  
  console.log(`✅ Alice is now admin: ${await tokenGatedDAO.isAdmin(alice.address)}`);
  
  // If still not admin, grant permanent admin role for demo
  if (!(await tokenGatedDAO.isAdmin(alice.address))) {
    console.log("Granting permanent admin role to Alice for demo...");
    await roleBasedNFT.grantRole(
      DAO_ADMIN_ROLE,
      1, // Alice's token
      alice.address,
      0, // No expiration
      true, // revocable
      ethers.toUtf8Bytes("Permanent admin for demo")
    );
    console.log(`✅ Alice is now admin: ${await tokenGatedDAO.isAdmin(alice.address)}`);
  }
  
  // Alice can now update DAO config
  console.log("Alice updating DAO configuration...");
  await tokenGatedDAO.connect(alice).updateConfig(
    43200,  // 12 hours voting delay
    604800, // 7 days voting period
    2,      // Higher proposal threshold
    5       // Higher quorum
  );
  console.log("✅ DAO configuration updated by Alice");
  
  // Revoke Charlie's voting rights
  console.log("Revoking Charlie's voting rights due to inactivity...");
  await roleBasedNFT.revokeRole(VOTER_ROLE, 3, charlie.address);
  console.log(`✅ Charlie can vote: ${await tokenGatedDAO.canVote(charlie.address)}`);
  
  // === Final Status Report ===
  console.log("\n📈 Final DAO Status Report");
  console.log(`Total NFTs minted: ${await roleBasedNFT.totalSupply()}`);
  console.log(`Total proposals: ${await tokenGatedDAO.proposalCount()}`);
  console.log(`Treasury balance: ${ethers.formatEther(await ethers.provider.getBalance(await tokenGatedDAO.getAddress()))} ETH`);
  
  console.log("\n👥 Final Member Status:");
  for (const user of users) {
    const isMember = await tokenGatedDAO.isMember(user.signer.address);
    const isAdmin = await tokenGatedDAO.isAdmin(user.signer.address);
    const canCreateProposal = await tokenGatedDAO.canCreateProposal(user.signer.address);
    const canVote = await tokenGatedDAO.canVote(user.signer.address);
    const votingPower = await tokenGatedDAO.getVotingPower(user.signer.address);
    
    console.log(`${user.name}: Member=${isMember}, Admin=${isAdmin}, Creator=${canCreateProposal}, Voter=${canVote}, Power=${votingPower}`);
  }
  
  console.log("\n🎉 Demo completed successfully!");
  console.log("\n💡 Key Features Demonstrated:");
  console.log("✓ Role-based permissions using ERC-7432");
  console.log("✓ Granular governance control");
  console.log("✓ Time-based role management");
  console.log("✓ Proposal lifecycle management");
  console.log("✓ Treasury operations");
  console.log("✓ Dynamic role assignment/revocation");
}

// Helper function to convert proposal state enum to readable string
async function getProposalStateName(state: number): Promise<string> {
  const stateNames = ["Pending", "Active", "Cancelled", "Defeated", "Succeeded", "Executed"];
  return stateNames[state] || "Unknown";
}

// Execute the demo
main().catch((error) => {
  console.error("❌ Demo failed:");
  console.error(error);
  process.exitCode = 1;
});

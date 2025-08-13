const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer, user1, user2, user3, user4] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Setting up roles with account:", deployer.address);
  console.log("Network:", network.name);

  // Load deployment info
  const deploymentFile = `./deployments/${network.name}-${network.chainId}.json`;
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please run deployment first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const { contracts, roles } = deploymentInfo;

  // Get contract instances
  const roleNFT = await ethers.getContractAt("RoleNFT", contracts.RoleNFT);
  const tokenGatedDAO = await ethers.getContractAt("TokenGatedDAO", contracts.TokenGatedDAO);

  console.log("\n=== Setting Up Member Roles ===\n");

  // Define member configurations
  const members = [
    {
      address: user1.address,
      name: "Alice (Voter + Proposer)",
      roles: [roles.VOTER_ROLE, roles.PROPOSER_ROLE],
      expirations: [0, 0] // No expiration
    },
    {
      address: user2.address,
      name: "Bob (Voter + Treasury Manager)",
      roles: [roles.VOTER_ROLE, roles.TREASURY_ROLE],
      expirations: [0, Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)] // 1 year expiration for treasury
    },
    {
      address: user3.address,
      name: "Charlie (Voter Only)",
      roles: [roles.VOTER_ROLE],
      expirations: [0]
    },
    {
      address: user4.address,
      name: "Diana (Admin + Veto Power)",
      roles: [roles.VOTER_ROLE, roles.PROPOSER_ROLE, roles.ADMIN_ROLE, roles.VETO_ROLE],
      expirations: [0, 0, 0, 0]
    }
  ];

  // Mint NFTs and assign roles to members
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    console.log(`${i + 1}. Setting up ${member.name}...`);

    try {
      // Mint NFT with roles
      const tx = await roleNFT.mint(
        member.address,
        `ipfs://QmTokenURI${i + 1}`, // Placeholder URI
        member.roles,
        member.expirations
      );
      
      await tx.wait();
      
      // Verify roles were assigned
      const tokenId = await roleNFT.totalSupply() - 1n; // Latest minted token
      
      console.log(`   ✅ NFT #${tokenId} minted to ${member.address}`);
      
      for (let j = 0; j < member.roles.length; j++) {
        const hasRole = await roleNFT.hasRole(member.roles[j], tokenId);
        const roleName = getRoleName(member.roles[j], roles);
        console.log(`   ${hasRole ? '✅' : '❌'} ${roleName} assigned`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to setup ${member.name}:`, error.message);
    }

    console.log("");
  }

  console.log("=== Setting Up Batch Roles ===\n");

  // Create additional voter tokens for testing
  const voterAddresses = [user1.address, user2.address, user3.address];
  const voterURIs = ["ipfs://voter1", "ipfs://voter2", "ipfs://voter3"];

  try {
    console.log("Creating additional voter NFTs...");
    await roleNFT.batchMint(
      voterAddresses,
      voterURIs,
      [roles.VOTER_ROLE],
      [0] // No expiration
    );
    console.log("✅ Batch minted additional voter NFTs");
  } catch (error) {
    console.error("❌ Batch minting failed:", error.message);
  }

  console.log("\n=== Role Verification ===\n");

  // Verify DAO functionality
  try {
    // Check voting power for each user
    for (const member of members) {
      const votingPower = await tokenGatedDAO.getVotingPower(member.address);
      const hasVoterRole = await tokenGatedDAO.hasRole(member.address, roles.VOTER_ROLE);
      const hasProposerRole = await tokenGatedDAO.hasRole(member.address, roles.PROPOSER_ROLE);
      
      console.log(`${member.name}:`);
      console.log(`   Voting Power: ${votingPower}`);
      console.log(`   Can Vote: ${hasVoterRole}`);
      console.log(`   Can Propose: ${hasProposerRole}`);
      console.log("");
    }
  } catch (error) {
    console.error("❌ Role verification failed:", error.message);
  }

  console.log("=== Creating Sample Roles with Expiration ===\n");

  try {
    // Grant temporary admin role to user1 (expires in 30 days)
    const tempAdminExpiration = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    
    // Find user1's token ID
    const user1TokenId = 1; // Assuming first minted token
    
    await roleNFT.grantRole(roles.ADMIN_ROLE, user1TokenId, tempAdminExpiration);
    
    const hasAdminRole = await roleNFT.hasRole(roles.ADMIN_ROLE, user1TokenId);
    const adminExpiration = await roleNFT.getRoleExpiration(roles.ADMIN_ROLE, user1TokenId);
    
    console.log(`✅ Granted temporary ADMIN_ROLE to token #${user1TokenId}`);
    console.log(`   Currently active: ${hasAdminRole}`);
    console.log(`   Expires: ${new Date(Number(adminExpiration) * 1000).toISOString()}`);
    
  } catch (error) {
    console.error("❌ Temporary role assignment failed:", error.message);
  }

  console.log("\n=== Setup Summary ===\n");

  // Generate summary report
  const setupSummary = {
    network: network.name,
    setupTime: new Date().toISOString(),
    membersConfigured: members.length,
    contracts: contracts,
    totalNFTsMinted: Number(await roleNFT.totalSupply()),
    roles: roles
  };

  // Save setup info
  const setupFile = `./deployments/${network.name}-setup.json`;
  fs.writeFileSync(setupFile, JSON.stringify(setupSummary, null, 2));

  console.log("📊 Setup Statistics:");
  console.log(`   Total NFTs minted: ${setupSummary.totalNFTsMinted}`);
  console.log(`   Members configured: ${setupSummary.membersConfigured}`);
  console.log(`   Setup info saved to: ${setupFile}`);

  console.log("\n🎉 Role setup completed successfully!");
  console.log("\nYou can now:");
  console.log("1. Create proposals using different member accounts");
  console.log("2. Test voting with various role holders");
  console.log("3. Verify role-based access control");
  console.log("4. Test role expiration functionality");
}

// Helper function to get role name
function getRoleName(roleHash, roles) {
  const roleMap = {
    [roles.VOTER_ROLE]: "VOTER_ROLE",
    [roles.PROPOSER_ROLE]: "PROPOSER_ROLE", 
    [roles.ADMIN_ROLE]: "ADMIN_ROLE",
    [roles.TREASURY_ROLE]: "TREASURY_ROLE",
    [roles.VETO_ROLE]: "VETO_ROLE"
  };
  
  return roleMap[roleHash] || "UNKNOWN_ROLE";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });
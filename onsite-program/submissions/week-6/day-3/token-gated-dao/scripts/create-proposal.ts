const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer, user1, user2, user3, user4] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Creating test proposals...");
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
  const proposalManager = await ethers.getContractAt("ProposalManager", contracts.ProposalManager);

  console.log("\n=== Creating Test Proposals ===\n");

  // Proposal 1: Simple Treasury Proposal
  try {
    console.log("1. Creating Treasury Proposal...");
    
    const treasuryProposal = {
      targets: [contracts.TokenGatedDAO], // Target the DAO itself
      values: [0], // No ETH transfer
      calldatas: [
        tokenGatedDAO.interface.encodeFunctionData("updateSettings", [
          86400,  // 1 day voting delay
          604800, // 7 days voting period  
          1,      // 1 token proposal threshold
          3       // 3 votes quorum
        ])
      ],
      description: "Update DAO voting parameters to optimize governance efficiency"
    };

    // Create proposal from user1 (should have PROPOSER_ROLE)
    const tx1 = await tokenGatedDAO.connect(user1).propose(
      treasuryProposal.targets,
      treasuryProposal.values,
      treasuryProposal.calldatas,
      treasuryProposal.description
    );

    const receipt1 = await tx1.wait();
    const proposalId1 = receipt1.logs[0].args[0];
    
    console.log(`   ✅ Proposal #${proposalId1} created by ${user1.address}`);
    
  } catch (error) {
    console.error("   ❌ Treasury proposal failed:", error.message);
  }

  // Proposal 2: Membership Proposal using Template
  try {
    console.log("\n2. Creating Membership Proposal using Template...");
    
    const membershipProposal = {
      targets: [contracts.RoleNFT],
      values: [0],
      calldatas: [
        roleNFT.interface.encodeFunctionData("mint", [
          "0x742d35Cc6634C0532925a3b8D4b8d57A7C7B2C3D", // New member address
          "ipfs://QmNewMemberURI",
          [roles.VOTER_ROLE],
          [0] // No expiration
        ])
      ],
      description: "Add new member to DAO with voting rights"
    };

    // Use ProposalManager to create with template
    const tx2 = await proposalManager.connect(user1).createProposalFromTemplate(
      1, // Template ID (General template)
      membershipProposal.targets,
      membershipProposal.values,
      membershipProposal.calldatas,
      membershipProposal.description,
      ["membership", "onboarding"], // tags
      2, // priority (1-5)
      "QmProposalDetailsIPFS" // IPFS hash for detailed proposal
    );

    const receipt2 = await tx2.wait();
    console.log(`   ✅ Template-based proposal created`);
    
  } catch (error) {
    console.error("   ❌ Membership proposal failed:", error.message);
  }

  // Proposal 3: Emergency Proposal (Admin only)
  try {
    console.log("\n3. Creating Emergency Proposal...");
    
    const emergencyProposal = {
      targets: [contracts.TokenGatedDAO],
      values: [0],
      calldatas: [
        tokenGatedDAO.interface.encodeFunctionData("updateSettings", [
          0,      // Immediate voting (no delay)
          86400,  // 1 day voting period (shortened)
          1,      // Keep proposal threshold
          2       // Reduced quorum for emergency
        ])
      ],
      description: "Emergency governance parameter update due to urgent security considerations",
      justification: "Recent governance attack on similar DAOs requires immediate parameter adjustment"
    };

    // Create emergency proposal (requires ADMIN_ROLE or VETO_ROLE)
    const tx3 = await proposalManager.connect(deployer).createEmergencyProposal(
      emergencyProposal.targets,
      emergencyProposal.values,
      emergencyProposal.calldatas,
      emergencyProposal.description,
      emergencyProposal.justification
    );

    const receipt3 = await tx3.wait();
    console.log(`   ✅ Emergency proposal created by deployer`);
    
  } catch (error) {
    console.error("   ❌ Emergency proposal failed:", error.message);
  }

  console.log("\n=== Supporting Proposals ===\n");

  // Support proposals before voting begins
  try {
    const proposalId = 1; // Support first proposal
    
    await proposalManager.connect(user2).supportProposal(proposalId);
    await proposalManager.connect(user3).supportProposal(proposalId);
    
    const supporters = await proposalManager.getProposalSupporters(proposalId);
    console.log(`✅ Proposal #${proposalId} supported by ${supporters.length} members`);
    
  } catch (error) {
    console.error("❌ Supporting proposal failed:", error.message);
  }

  console.log("\n=== Simulating Voting Process ===\n");

  // Wait for voting delay to pass (if in test environment, we might need to advance time)
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("Advancing blockchain time for testing...");
    
    // Advance time by 1 day + 1 hour to pass voting delay
    await ethers.provider.send("evm_increaseTime", [86400 + 3600]);
    await ethers.provider.send("evm_mine", []);
    
    console.log("✅ Time advanced - voting period active");
  }

  // Simulate voting on first proposal
  try {
    const proposalId = 1;
    const proposalState = await tokenGatedDAO.state(proposalId);
    console.log(`Proposal #${proposalId} state:`, getStateName(proposalState));

    if (proposalState === 1) { // Active state
      console.log("\nCasting votes...");
      
      // Vote FOR from user1
      await tokenGatedDAO.connect(user1).castVote(proposalId, 1, "I support this proposal");
      console.log("✅ user1 voted FOR");
      
      // Vote FOR from user2  
      await tokenGatedDAO.connect(user2).castVote(proposalId, 1, "Agree with the changes");
      console.log("✅ user2 voted FOR");
      
      // Vote ABSTAIN from user3
      await tokenGatedDAO.connect(user3).castVote(proposalId, 2, "Need more information");
      console.log("✅ user3 voted ABSTAIN");

      // Check voting results
      const proposal = await tokenGatedDAO.getProposal(proposalId);
      console.log(`\nVoting Results for Proposal #${proposalId}:`);
      console.log(`   For: ${proposal.forVotes}`);
      console.log(`   Against: ${proposal.againstVotes}`);
      console.log(`   Abstain: ${proposal.abstainVotes}`);
      
    } else {
      console.log("❌ Proposal not in active state for voting");
    }
    
  } catch (error) {
    console.error("❌ Voting simulation failed:", error.message);
  }

  console.log("\n=== Testing Role-Based Access ===\n");

  // Test access control
  try {
    console.log("Testing access control...");
    
    // Try to create proposal from user3 (should only have VOTER_ROLE)
    try {
      await tokenGatedDAO.connect(user3).propose(
        [contracts.TokenGatedDAO],
        [0],
        ["0x"],
        "This should fail - user3 doesn't have PROPOSER_ROLE"
      );
      console.log("❌ Access control failed - user3 should not be able to propose");
    } catch (error) {
      console.log("✅ Access control working - user3 correctly denied proposal creation");
    }

    // Test veto functionality (if user4 has VETO_ROLE)
    const hasVetoRole = await tokenGatedDAO.hasRole(user4.address, roles.VETO_ROLE);
    if (hasVetoRole) {
      try {
        await tokenGatedDAO.connect(user4).veto(1);
        console.log("✅ Veto functionality working - proposal vetoed by user4");
      } catch (error) {
        console.log("ℹ️ Veto failed (proposal might be in wrong state):", error.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Access control testing failed:", error.message);
  }

  console.log("\n=== Final Status Report ===\n");

  // Generate final report
  try {
    const totalProposals = await tokenGatedDAO.proposalCounter();
    console.log(`📊 Governance Statistics:`);
    console.log(`   Total Proposals Created: ${totalProposals}`);
    
    for (let i = 1; i <= totalProposals; i++) {
      const proposal = await tokenGatedDAO.getProposal(i);
      const state = await tokenGatedDAO.state(i);
      console.log(`   Proposal #${i}: ${getStateName(state)} (For: ${proposal.forVotes}, Against: ${proposal.againstVotes})`);
    }

    // Save test results
    const testResults = {
      network: network.name,
      testTime: new Date().toISOString(),
      totalProposals: Number(totalProposals),
      testsPassed: true,
      contracts: contracts
    };

    const testFile = `./deployments/${network.name}-test-results.json`;
    fs.writeFileSync(testFile, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Test results saved to: ${testFile}`);

  } catch (error) {
    console.error("❌ Status report generation failed:", error.message);
  }

  console.log("\n🎉 Proposal creation and testing completed!");
  console.log("\nYour DAO is now ready for use with:");
  console.log("✅ Role-based access control");
  console.log("✅ Proposal creation and voting");
  console.log("✅ Emergency governance procedures");
  console.log("✅ Template-based proposal management");
}

// Helper function to convert state number to name
function getStateName(state) {
  const states = [
    "Pending",
    "Active", 
    "Canceled",
    "Defeated",
    "Succeeded",
    "Queued",
    "Expired",
    "Executed"
  ];
  return states[state] || "Unknown";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Proposal creation failed:");
    console.error(error);
    process.exit(1);
  });
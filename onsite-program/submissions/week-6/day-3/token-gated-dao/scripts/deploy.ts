const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", network.name, "- Chain ID:", network.chainId);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  console.log("\n=== Starting Deployment ===\n");

  // Deploy RoleValidator first
  console.log("1. Deploying RoleValidator...");
  const RoleValidator = await ethers.getContractFactory("RoleValidator");
  const roleValidator = await RoleValidator.deploy();
  await roleValidator.waitForDeployment();
  const roleValidatorAddress = await roleValidator.getAddress();
  console.log("✅ RoleValidator deployed to:", roleValidatorAddress);

  // Deploy RoleNFT
  console.log("\n2. Deploying RoleNFT...");
  const RoleNFT = await ethers.getContractFactory("RoleNFT");
  const roleNFT = await RoleNFT.deploy(
    "DAO Member NFT", // name
    "DAONFT" // symbol
  );
  await roleNFT.waitForDeployment();
  const roleNFTAddress = await roleNFT.getAddress();
  console.log("✅ RoleNFT deployed to:", roleNFTAddress);

  // Deploy TokenGatedDAO
  console.log("\n3. Deploying TokenGatedDAO...");
  const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
  const tokenGatedDAO = await TokenGatedDAO.deploy(
    roleNFTAddress,
    roleValidatorAddress
  );
  await tokenGatedDAO.waitForDeployment();
  const tokenGatedDAOAddress = await tokenGatedDAO.getAddress();
  console.log("✅ TokenGatedDAO deployed to:", tokenGatedDAOAddress);

  // Deploy ProposalManager
  console.log("\n4. Deploying ProposalManager...");
  const ProposalManager = await ethers.getContractFactory("ProposalManager");
  const proposalManager = await ProposalManager.deploy(tokenGatedDAOAddress);
  await proposalManager.waitForDeployment();
  const proposalManagerAddress = await proposalManager.getAddress();
  console.log("✅ ProposalManager deployed to:", proposalManagerAddress);

  console.log("\n=== Post-Deployment Setup ===\n");

  // Grant ROLE_ADMIN to TokenGatedDAO for managing roles
  console.log("5. Setting up role permissions...");
  const ROLE_ADMIN = await roleNFT.ROLE_ADMIN();
  await roleNFT.grantRole(ROLE_ADMIN, tokenGatedDAOAddress, 0); // No expiration
  console.log("✅ Granted ROLE_ADMIN to TokenGatedDAO");

  // Create some sample templates in ProposalManager
  console.log("\n6. Creating default proposal templates...");
  
  const VOTER_ROLE = await roleNFT.VOTER_ROLE();
  const PROPOSER_ROLE = await roleNFT.PROPOSER_ROLE();
  const TREASURY_ROLE = await roleNFT.TREASURY_ROLE();

  // General proposal template
  await proposalManager.createTemplate(
    "General Proposal",
    "Standard proposal for general DAO matters",
    0, // ProposalCategory.General
    [PROPOSER_ROLE],
    1, // minimum voting power
    604800 // 7 days in seconds
  );

  // Treasury proposal template
  await proposalManager.createTemplate(
    "Treasury Proposal",
    "Proposal for treasury management and fund allocation",
    1, // ProposalCategory.Treasury
    [TREASURY_ROLE, PROPOSER_ROLE],
    3, // minimum voting power
    864000 // 10 days in seconds
  );

  console.log("✅ Created default proposal templates");

  // Mint initial NFTs for the deployer
  console.log("\n7. Minting initial NFTs...");
  
  const initialRoles = [VOTER_ROLE, PROPOSER_ROLE, TREASURY_ROLE];
  const initialExpirations = [0, 0, 0]; // No expiration

  await roleNFT.mint(
    deployer.address,
    "ipfs://QmYourTokenURI", // Replace with actual IPFS URI
    initialRoles,
    initialExpirations
  );

  console.log("✅ Minted initial NFT with admin roles to deployer");

  console.log("\n=== Deployment Summary ===\n");

  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: Number(network.chainId)
    },
    contracts: {
      RoleValidator: roleValidatorAddress,
      RoleNFT: roleNFTAddress,
      TokenGatedDAO: tokenGatedDAOAddress,
      ProposalManager: proposalManagerAddress
    },
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    roles: {
      VOTER_ROLE: VOTER_ROLE,
      PROPOSER_ROLE: PROPOSER_ROLE,
      ADMIN_ROLE: await roleNFT.ADMIN_ROLE(),
      TREASURY_ROLE: TREASURY_ROLE,
      VETO_ROLE: await roleNFT.VETO_ROLE()
    }
  };

  console.log("Contract Addresses:");
  console.log("==================");
  console.log("RoleValidator:   ", roleValidatorAddress);
  console.log("RoleNFT:         ", roleNFTAddress);
  console.log("TokenGatedDAO:   ", tokenGatedDAOAddress);
  console.log("ProposalManager: ", proposalManagerAddress);

  console.log("\nRole Identifiers:");
  console.log("================");
  console.log("VOTER_ROLE:     ", VOTER_ROLE);
  console.log("PROPOSER_ROLE:  ", PROPOSER_ROLE);
  console.log("ADMIN_ROLE:     ", deploymentInfo.roles.ADMIN_ROLE);
  console.log("TREASURY_ROLE:  ", TREASURY_ROLE);
  console.log("VETO_ROLE:      ", deploymentInfo.roles.VETO_ROLE);

  // Save deployment info to file
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${deploymentsDir}/${network.name}-${network.chainId}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filename}`);

  console.log("\n=== Verification Commands ===");
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nTo verify contracts on Etherscan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${roleValidatorAddress}`);
    console.log(`npx hardhat verify --network ${network.name} ${roleNFTAddress} "DAO Member NFT" "DAONFT"`);
    console.log(`npx hardhat verify --network ${network.name} ${tokenGatedDAOAddress} ${roleNFTAddress} ${roleValidatorAddress}`);
    console.log(`npx hardhat verify --network ${network.name} ${proposalManagerAddress} ${tokenGatedDAOAddress}`);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Run 'npm run setup-roles' to configure additional roles");
  console.log("2. Run 'npm run create-proposal' to test proposal creation");
  console.log("3. Interact with your DAO through the deployed contracts");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
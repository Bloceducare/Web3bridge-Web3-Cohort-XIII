import { ethers } from "hardhat";
import hre from "hardhat";

async function main(): Promise<void> {
  // Get signers
  const [deployer, user1, user2] = await hre.ethers.getSigners();

  // Contract addresses (update these with your deployed addresses)
  const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const roleRegistryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const daoAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  // Get contract instances
  const nft = await hre.ethers.getContractAt("Nft", nftAddress);
  const roleRegistry = await hre.ethers.getContractAt(
    "ERC7432RoleRegistry",
    roleRegistryAddress
  );
  const dao = await hre.ethers.getContractAt("TokenGatedDAO", daoAddress);

  console.log("=== NFT INTERACTION ===");

  // Test NFT details
  console.log("NFT Name:", await nft.name());
  console.log("NFT Symbol:", await nft.symbol());

  // Test safeMint function (anyone can mint)
  console.log("\n--- Testing safeMint ---");
  const safeMintTx = await nft
    .connect(user1)
    .safeMint("ipfs://QmUserMintedToken");
  const safeMintReceipt = await safeMintTx.wait();

  const transferEvent = safeMintReceipt.logs?.find((log) => {
    try {
      const parsed = nft.interface.parseLog(log);
      return parsed?.name === "Transfer";
    } catch {
      return false;
    }
  });

  const userTokenId = transferEvent
    ? nft.interface.parseLog(transferEvent).args.tokenId
    : null;
  console.log("User1 minted token ID:", userTokenId?.toString());
  console.log("Owner of token:", await nft.ownerOf(userTokenId));

  // Test owner mint function
  console.log("\n--- Testing owner mint ---");
  const ownerMintTx = await nft
    .connect(deployer)
    .mint(user2.address, "ipfs://QmOwnerMintedToken");
  const ownerMintReceipt = await ownerMintTx.wait();

  const ownerTransferEvent = ownerMintReceipt.logs?.find((log) => {
    try {
      const parsed = nft.interface.parseLog(log);
      return parsed?.name === "Transfer";
    } catch {
      return false;
    }
  });

  const ownerTokenId = ownerTransferEvent
    ? nft.interface.parseLog(ownerTransferEvent).args.tokenId
    : null;
  console.log("Owner minted token ID:", ownerTokenId?.toString());
  console.log("Owner of token:", await nft.ownerOf(ownerTokenId));

  console.log("\n=== ROLE REGISTRY INTERACTION ===");

  // Set up roles
  const voterRole = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Voter()"));
  const proposerRole = hre.ethers.keccak256(
    hre.ethers.toUtf8Bytes("Proposer()")
  );

  // Grant approval to user2 to manage roles for deployer's tokens
  console.log("\n--- Setting up role approvals ---");
  await roleRegistry
    .connect(deployer)
    .setRoleApprovalForAll(nftAddress, user2.address, true);
  console.log("✅ Granted approval to user2 for managing deployer's roles");

  // Grant voter role to user1 for their own token (using user2 as approved manager)
  await roleRegistry
    .connect(user1)
    .setRoleApprovalForAll(nftAddress, user2.address, true);
  console.log("✅ Granted approval to user2 for managing user1's roles");

  // Grant roles using user2 (who has approval)
  console.log("\n--- Granting roles ---");

  const voterRoleStruct = {
    roleId: voterRole,
    tokenAddress: nftAddress,
    tokenId: userTokenId,
    recipient: user1.address,
    expirationDate: 0,
    revocable: true,
    data: "0x",
  };

  await roleRegistry.connect(user2).grantRole(voterRoleStruct);
  console.log("✅ Granted voter role to user1");

  const proposerRoleStruct = {
    roleId: proposerRole,
    tokenAddress: nftAddress,
    tokenId: 0, // First token minted by deployer
    recipient: deployer.address,
    expirationDate: 0,
    revocable: true,
    data: "0x",
  };

  await roleRegistry.connect(user2).grantRole(proposerRoleStruct);
  console.log("✅ Granted proposer role to deployer");

  // Verify roles
  const hasVoterRole = await roleRegistry.hasRole(
    voterRole,
    nftAddress,
    userTokenId,
    user1.address
  );
  const hasProposerRole = await roleRegistry.hasRole(
    proposerRole,
    nftAddress,
    0,
    deployer.address
  );

  console.log("User1 has voter role:", hasVoterRole);
  console.log("Deployer has proposer role:", hasProposerRole);

  console.log("\n=== DAO INTERACTION ===");

  // Create a proposal
  if (hasProposerRole) {
    console.log("\n--- Creating proposal ---");
    const proposalTx = await dao
      .connect(deployer)
      .createProposal(
        nftAddress,
        0,
        "Proposal to increase community funding by 10%"
      );
    await proposalTx.wait();
    console.log("✅ Proposal created successfully");

    // Check proposal details
    const proposal = await dao.proposals(1);
    console.log("Proposal ID: 1");
    console.log("Description:", proposal.description);
    console.log("Proposer:", proposal.proposer);
  }

  console.log("\n=== SUMMARY ===");
  console.log(
    "NFTs minted:",
    (await nft.balanceOf(user1.address)).toString(),
    "to user1"
  );
  console.log(
    "NFTs minted:",
    (await nft.balanceOf(user2.address)).toString(),
    "to user2"
  );
  console.log("Total roles granted: 2");
  console.log("Total proposals created: 1");
}

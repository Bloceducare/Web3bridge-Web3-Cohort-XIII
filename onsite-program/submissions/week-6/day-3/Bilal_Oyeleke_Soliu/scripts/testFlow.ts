import hre from "hardhat";

async function main() {
  const daoAddress = "YOUR_DAO_CONTRACT_ADDRESS"; // Replace with your deployed ManageDAO contract address
  const dao = await hre.ethers.getContractAt("ManageDAO", daoAddress);

  const [owner, worker, contributor] = await hre.ethers.getSigners();
  const nftRecipient = "0xf070F568c125b2740391136662Fc600A2A29D2A6";

  // 1. Onboard a protocol worker
  console.log("Onboarding protocol worker...");
  await dao.connect(owner).createMember(
    "Alice",
    30,
    nftRecipient,
    Math.floor(Date.now() / 1000) + 3600,
    "Protocol Worker",
    0 // RoleType.protocolWorker
  );
  console.log("Protocol worker onboarded.");

  // 2. Onboard a contributor
  console.log("Onboarding contributor...");
  await dao.connect(owner).createMember(
    "Bob",
    25,
    nftRecipient,
    Math.floor(Date.now() / 1000) + 3600,
    "Contributor",
    1 // RoleType.protocolContributor
  );
  console.log("Contributor onboarded.");

  // 3. Mint NFTs to the specified address
  // The NFT minting is handled within the createMember function.
  // We can't directly specify the recipient of the NFT in the current contract design.
  // The NFT is minted to the member's address.
  // To mint to a specific address, the contract would need to be modified.
  console.log("NFTs will be minted to the member's address, not the specified recipient address.");


  // 4. Protocol worker creates a proposal
  console.log("Protocol worker creating a proposal...");
  await dao.connect(worker).createProposal(
    "New Feature",
    "Implement a new feature for the protocol"
  );
  console.log("Proposal created by protocol worker.");

  // 5. Contributor attempts to create a proposal (and fails)
  console.log("Contributor attempting to create a proposal...");
  try {
    await dao.connect(contributor).createProposal(
      "Another Idea",
      "This should fail"
    );
  } catch (error) {
    console.log("Contributor failed to create proposal as expected.");
  }

  // 6. Both users vote on the proposal
  const proposals = await dao.proposals(0); // Assuming this is the first proposal
  const proposalId = proposals[0];

  console.log("Worker voting on proposal...");
  await dao.connect(worker).castVote(proposalId, true);
  console.log("Worker voted.");

  console.log("Contributor voting on proposal...");
  await dao.connect(contributor).castVote(proposalId, false);
  console.log("Contributor voted.");

  console.log("Flow testing complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

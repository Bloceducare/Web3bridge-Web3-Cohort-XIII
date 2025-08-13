import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ZenDAOGovernance, ERC7432, ZenDAO } from "../typechain-types";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

describe("ZenDAOGovernance", function () {
  let governance: ZenDAOGovernance;
  let nftContract: ZenDAO;
  let roleRegistry: ERC7432;
  let owner: HardhatEthersSigner;
  let proposer: HardhatEthersSigner;
  let voter: HardhatEthersSigner;
  let tokenId: number;
  let expirationDate: number;
  const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
  const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER"));
  const uri =
    "https://ipfs.io/ipfs/bafkreibqpz53yrieu3kh6rkehjrxa2nezb443e4qvxa57d3oojkjxlyykq";

  beforeEach(async function () {
    // Get signers
    [owner, proposer, voter] = await ethers.getSigners();

    // Deploy mock ZenDAO nft
    const ERC721Factory = await ethers.getContractFactory("ZenDAO");
    nftContract = await ERC721Factory.deploy(owner.address);
    await nftContract.waitForDeployment();

    // Deploy mock ERC7432
    const ERC7432Factory = await ethers.getContractFactory("ERC7432");
    roleRegistry = await ERC7432Factory.deploy();
    await roleRegistry.waitForDeployment();

    // Deploy ZenDAOGovernance
    const GovernanceFactory = await ethers.getContractFactory(
      "ZenDAOGovernance"
    );
    governance = await GovernanceFactory.deploy(
      nftContract.getAddress(),
      roleRegistry.getAddress(),
      owner.address
    );
    await governance.waitForDeployment();

    // Setup test parameters
    tokenId = 1;
    expirationDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

    // Mint NFT to proposer and voter
    await nftContract.connect(proposer).safeMint(uri);
    await nftContract.connect(voter).safeMint(uri);
  });

  describe("Role Management", function () {
    it("should grant and revoke voter role", async function () {
      await expect(
        governance
          .connect(owner)
          .grantVoterRole(tokenId, proposer.address, expirationDate, "0x")
      )
        .to.emit(governance, "RoleGranted")
        .withArgs(VOTER_ROLE, tokenId, proposer.address);

      await expect(
        governance.connect(owner).revokeVoterRole(tokenId, proposer.address)
      )
        .to.emit(governance, "RoleRevoked")
        .withArgs(VOTER_ROLE, tokenId, proposer.address);
    });

    it("should grant and revoke proposer role", async function () {
      await expect(
        governance
          .connect(owner)
          .grantProposerRole(tokenId, proposer.address, expirationDate, "0x")
      )
        .to.emit(governance, "RoleGranted")
        .withArgs(PROPOSER_ROLE, tokenId, proposer.address);

      await expect(
        governance.connect(owner).revokeProposerRole(tokenId, proposer.address)
      )
        .to.emit(governance, "RoleRevoked")
        .withArgs(PROPOSER_ROLE, tokenId, proposer.address);
    });
  });

  describe("Proposal Creation", function () {
    it("should create a proposal successfully", async function () {
      expect(
        await governance
          .connect(owner)
          .grantProposerRole(1, proposer.address, expirationDate, "0x")
      )
        .to.emit(governance, "RoleGranted")
        .withArgs(PROPOSER_ROLE, tokenId, proposer.address);     

      const description = "Test proposal";
      await expect(
        governance.connect(proposer).createProposal(description)
      ).to.emit(governance, "ProposalCreated");

      const proposal = await governance.proposals(0);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.description).to.equal(description);
      expect(proposal.executed).to.be.false;
    });

    it("should revert if proposer doesn't have role", async function () {
      await expect(
        governance.connect(proposer).createProposal("Test proposal")
      ).to.be.revertedWith("Must have Proposer role");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await governance
        .connect(owner)
        .grantProposerRole(tokenId, proposer.address, expirationDate, "0x");
      await governance.connect(proposer).createProposal("Test proposal");
    });

    it("should allow voting with valid voter role", async function () {
      await governance
        .connect(owner)
        .grantVoterRole(tokenId + 1, voter.address, expirationDate, "0x");

      await expect(governance.connect(voter).vote(0, true))
        .to.emit(governance, "Voted")
        .withArgs(0, voter.address, true);

      const proposal = await governance.proposals(0);
      expect(proposal.yesVotes).to.equal(1);
    });

    it("should revert if voter doesn't have role", async function () {
      await expect(governance.connect(voter).vote(0, true)).to.be.revertedWith(
        "Must have Voter role"
      );
    });

    it("should revert if voting after deadline", async function () {
      await governance
        .connect(owner)
        .grantVoterRole(tokenId + 1, voter.address, expirationDate, "0x");

      await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]); // 4 days
      await expect(governance.connect(voter).vote(0, true)).to.be.revertedWith(
        "Voting closed"
      );
    });
  });
});

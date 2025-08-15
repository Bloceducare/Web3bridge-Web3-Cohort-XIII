import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("TokenGatedDAO", function () {
  let roleNFT, dao, owner, voter1, voter2, proposer, executor;
  let VOTER_ROLE, PROPOSER_ROLE, EXECUTOR_ROLE;
  let futureTime;

  beforeEach(async function () {
    [owner, voter1, voter2, proposer, executor] = await ethers.getSigners();

    // Deploy RoleNFT
    const RoleNFT = await ethers.getContractFactory("RoleNFT");
    roleNFT = await RoleNFT.deploy();

    // Deploy DAO
    const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
    dao = await TokenGatedDAO.deploy(await roleNFT.getAddress());

    // Set DAO contract address in RoleNFT
    await roleNFT.setDAOContract(await dao.getAddress());

    // Define roles
    VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER_ROLE"));
    PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE"));
    EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));

    // Mint NFTs for roles
    await roleNFT.mint(voter1.address);   // tokenId 0
    await roleNFT.mint(proposer.address); // tokenId 1
    await roleNFT.mint(executor.address); // tokenId 2
    await roleNFT.mint(voter2.address);   // tokenId 3

    futureTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

    // Assign roles to correct tokenIds
    await roleNFT.grantRole(VOTER_ROLE, 0, voter1.address, futureTime, true, "0x");
    await roleNFT.grantRole(VOTER_ROLE, 3, voter2.address, futureTime, true, "0x");
    await roleNFT.grantRole(PROPOSER_ROLE, 1, proposer.address, futureTime, true, "0x");
    await roleNFT.grantRole(EXECUTOR_ROLE, 2, executor.address, futureTime, true, "0x");
  });

  describe("Role Management", function () {
    it("Should grant and check roles correctly", async function () {
      expect(await roleNFT.hasRole(VOTER_ROLE, 0, voter1.address)).to.be.true;
      expect(await roleNFT.hasRole(PROPOSER_ROLE, 1, proposer.address)).to.be.true;
      expect(await roleNFT.hasRole(EXECUTOR_ROLE, 2, executor.address)).to.be.true;
    });

    it("Should revoke roles", async function () {
      await roleNFT.revokeRole(VOTER_ROLE, 0, voter1.address);
      expect(await roleNFT.hasRole(VOTER_ROLE, 0, voter1.address)).to.be.false;
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow proposer to create proposal", async function () {
      await expect(dao.connect(proposer).createProposal("Test Proposal"))
        .to.emit(dao, "ProposalCreated");
    });

    it("Should reject proposal creation from non-proposer", async function () {
      await expect(dao.connect(voter1).createProposal("Test Proposal"))
        .to.be.revertedWith("Insufficient role permissions");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await dao.connect(proposer).createProposal("Test Proposal");
    });

    it("Should allow voter to vote", async function () {
      await expect(dao.connect(voter1).vote(0, true))
        .to.emit(dao, "VoteCast")
        .withArgs(0, voter1.address, true);
    });

    it("Should reject voting from non-voter", async function () {
      await expect(dao.connect(proposer).vote(0, true))
        .to.be.revertedWith("Insufficient role permissions");
    });

    it("Should prevent double voting", async function () {
      await dao.connect(voter1).vote(0, true);
      await expect(dao.connect(voter1).vote(0, false))
        .to.be.revertedWith("Already voted");
    });

    it("Should reject voting after deadline", async function () {
      // First vote to prove role works
      await dao.connect(voter1).vote(0, true);

      // Move past voting deadline
      await time.increase(8 * 24 * 60 * 60);

      // Try voting again after deadline
      await expect(dao.connect(voter2).vote(0, true))
        .to.be.revertedWith("Voting period ended");
    });
  });

  describe("Proposal Execution", function () {
    beforeEach(async function () {
      await dao.connect(proposer).createProposal("Test Proposal");
      await dao.connect(voter1).vote(0, true);
    });

    it("Should allow executor to execute passed proposal", async function () {
      await time.increase(8 * 24 * 60 * 60); // move past deadline
      await expect(dao.connect(executor).executeProposal(0))
        .to.emit(dao, "ProposalExecuted")
        .withArgs(0);
    });

    it("Should reject execution before deadline", async function () {
      await expect(dao.connect(executor).executeProposal(0))
        .to.be.revertedWith("Voting still active");
    });

    it("Should reject execution of failed proposal", async function () {
      await dao.connect(voter2).vote(0, false);
      await time.increase(8 * 24 * 60 * 60);
      await expect(dao.connect(executor).executeProposal(0))
        .to.be.revertedWith("Proposal rejected");
    });

    it("Should reject execution from non-executor", async function () {
      await time.increase(8 * 24 * 60 * 60);
      await expect(dao.connect(voter1).executeProposal(0))
        .to.be.revertedWith("Insufficient role permissions");
    });
  });

  describe("Proposal Queries", function () {
    it("Should return correct proposal details", async function () {
      await dao.connect(proposer).createProposal("Test Proposal");
      const proposal = await dao.getProposal(0);
      expect(proposal.description).to.equal("Test Proposal");
      expect(proposal.executed).to.be.false;
    });
  });
});

const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("CouncilDAO with ERC-7432 RoleNFT", function () {
  let roleNFT, dao;
  let owner, proposer, voter, outsider;

  const PROPOSER = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER"));
  const VOTER = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));

  beforeEach(async function () {
    try {
      [owner, proposer, voter, outsider] = await ethers.getSigners();

      const RoleNFT = await ethers.getContractFactory("RoleNFT");
      roleNFT = await RoleNFT.connect(owner).deploy();

      const CouncilDAO = await ethers.getContractFactory("CouncilDAO");
      dao = await CouncilDAO.connect(owner).deploy(roleNFT.target);

      const proposerTokenId = 0; // first token
      const voterTokenId = 1; // second token

      await roleNFT.connect(owner).mint(proposer.address);
      await roleNFT.connect(owner).mint(voter.address);

      const future = Math.floor(Date.now() / 1000) + 3600;
      await roleNFT
        .connect(owner)
        .grantRole(proposerTokenId, PROPOSER, proposer.address, future);

      await roleNFT
        .connect(owner)
        .grantRole(voterTokenId, VOTER, voter.address, future);

      this.proposerTokenId = proposerTokenId;
      this.voterTokenId = voterTokenId;
    } catch (err) {
      console.error("Error in beforeEach:", err);
      throw err;
    }
  });

  it("should allow proposer to create a proposal", async function () {
    await dao
      .connect(proposer)
      .createProposal(this.proposerTokenId, "Fund open-source devs");
    const proposal = await dao.getProposal(0);
    expect(proposal.description).to.equal("Fund open-source devs");
    expect(proposal.active).to.be.true;
  });

  it("should allow voter to vote on a proposal", async function () {
    await dao
      .connect(proposer)
      .createProposal(this.proposerTokenId, "Fund open-source devs");
    await dao.connect(voter).vote(this.voterTokenId, 0, true);
    const proposal = await dao.getProposal(0);
    expect(proposal.votesFor).to.equal(1);
    expect(proposal.votesAgainst).to.equal(0);
  });

  it("should prevent double voting", async function () {
    await dao
      .connect(proposer)
      .createProposal(this.proposerTokenId, "Fund open-source devs");
    await dao.connect(voter).vote(this.voterTokenId, 0, true);
    await expect(
      dao.connect(voter).vote(this.voterTokenId, 0, false)
    ).to.be.revertedWith("Already voted");
  });

  it("should reject unauthorized proposer", async function () {
    await expect(
      dao.connect(outsider).createProposal(this.proposerTokenId, "Invalid")
    ).to.be.revertedWith("Not authorized to propose");
  });

  it("should reject unauthorized voter", async function () {
    await dao
      .connect(proposer)
      .createProposal(this.proposerTokenId, "Fund open-source devs");
    await expect(
      dao.connect(outsider).vote(this.voterTokenId, 0, true)
    ).to.be.revertedWith("Not authorized to vote");
  });

  it("should close proposal and emit result", async function () {
    await dao
      .connect(proposer)
      .createProposal(this.proposerTokenId, "Fund open-source devs");
    await dao.connect(voter).vote(this.voterTokenId, 0, true);

    await expect(dao.connect(owner).closeProposal(0))
      .to.emit(dao, "ProposalExecuted")
      .withArgs(0, "Fund open-source devs", 1, 0, true);

    const proposal = await dao.getProposal(0);
    expect(proposal.active).to.be.false;
    expect(proposal.executed).to.be.true;
  });
});

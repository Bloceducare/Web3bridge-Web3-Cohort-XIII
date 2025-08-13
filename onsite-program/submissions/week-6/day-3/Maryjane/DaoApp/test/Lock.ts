// test/simpleGovernance.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";

describe("DAODAOGovernance", function () {
  let governance;
  let owner, addr1, addr2;
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Governance = await ethers.getContractFactory("DAODAOGovernance");
    governance = await Governance.deploy();
    await governance.waitForDeployment();
  });

  it("Should allow owner to grant propose role and create proposal", async function () {
    await governance.grantRole("CAN_PROPOSE", addr1.address);
    await governance.connect(addr1).createProposal("Test Proposal");

    const proposal = await governance.proposals(1);
    expect(proposal.description).to.equal("Test Proposal");
    expect(proposal.proposer).to.equal(addr1.address);
  });

  it("Should revert if user without role tries to create proposal", async function () {
    await expect(
      governance.connect(addr2).createProposal("Hacked!")
    ).to.be.revertedWith("No propose permission");
  });

  it("Should allow voting if user has CAN_VOTE role", async function () {
    await governance.grantRole("CAN_PROPOSE", owner.address);
    await governance.createProposal("Vote on this");

    await governance.grantRole("CAN_VOTE", addr1.address);
    await governance.connect(addr1).vote(1, true);

    const proposal = await governance.proposals(1);
    expect(proposal.voteCount).to.equal(1n); 
  });
});
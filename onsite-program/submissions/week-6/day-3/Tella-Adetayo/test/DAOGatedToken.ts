import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenGatedDAO", function () {
  async function deployFixture() {
    const [owner, proposer, voter] = await ethers.getSigners();

    // Deploy a mock RolesRegistry that always returns correct data for testing
    const RolesRegistry = await ethers.getContractFactory("MockRolesRegistry");
    const rolesRegistry = await RolesRegistry.deploy();
    await rolesRegistry.waitForDeployment();

    // Deploy DAO with the registry address
    const DAO = await ethers.getContractFactory("TokenGatedDAO");
    const dao = await DAO.deploy(await rolesRegistry.getAddress());
    await dao.waitForDeployment();

    return { dao, rolesRegistry, owner, proposer, voter };
  }

  it("should allow a proposer with role to create a proposal", async function () {
    const { dao, rolesRegistry, proposer } = await deployFixture();

    // Set the proposer role in mock
    const ROLE_PROPOSER = ethers.keccak256(ethers.toUtf8Bytes("DAO_PROPOSER"));
    await rolesRegistry.setRoleActive(
      proposer.address,
      ROLE_PROPOSER,
      true
    );

    // Call propose
    const tx = await dao.connect(proposer).propose(
      [ethers.ZeroAddress],       // targets
      [0],                        // values
      ["0x"],                     // calldatas
      "Proposal 1",               // description
      ethers.ZeroAddress,         // tokenAddress
      [1],                        // tokenIds
      ROLE_PROPOSER               // roleId
    );

    await expect(tx)
      .to.emit(dao, "ProposalCreated")
      .withArgs(1, proposer.address, anyValue, anyValue, anyValue, anyValue, anyValue, "Proposal 1");

    const proposal = await dao.proposals(1);
    expect(proposal.id).to.equal(1);
  });

  it("should allow a voter with role to cast a vote", async function () {
    const { dao, rolesRegistry, proposer, voter } = await deployFixture();

    const ROLE_PROPOSER = ethers.keccak256(ethers.toUtf8Bytes("DAO_PROPOSER"));
    const ROLE_VOTER = ethers.keccak256(ethers.toUtf8Bytes("DAO_VOTER"));

    // Give proposer and voter roles in mock
    await rolesRegistry.setRoleActive(proposer.address, ROLE_PROPOSER, true);
    await rolesRegistry.setRoleActive(voter.address, ROLE_VOTER, true);

    // Propose first
    await dao.connect(proposer).propose(
      [ethers.ZeroAddress],
      [0],
      ["0x"],
      "Proposal 1",
      ethers.ZeroAddress,
      [1],
      ROLE_PROPOSER
    );

    // Vote
    const tx = await dao.connect(voter).castVoteWithTokens(
      1,
      true,
      ethers.ZeroAddress,
      [1]
    );

    await expect(tx)
      .to.emit(dao, "VoteCast")
      .withArgs(voter.address, 1, true, 1);

    const prop = await dao.proposals(1);
    expect(prop.forVotes).to.equal(1);
  });
});

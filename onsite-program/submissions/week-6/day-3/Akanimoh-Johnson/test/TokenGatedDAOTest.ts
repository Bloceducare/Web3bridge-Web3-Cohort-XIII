const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenGatedDAO", function () {
  let membershipNFT, rolesRegistry, dao, owner, addr1, addr2;
  const VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
  const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER"));

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MembershipNFT = await ethers.getContractFactory("MembershipNFT");
    membershipNFT = await MembershipNFT.deploy();
    await membershipNFT.waitForDeployment();

    const RolesRegistry = await ethers.getContractFactory("RolesRegistry");
    rolesRegistry = await RolesRegistry.deploy();
    await rolesRegistry.waitForDeployment();

    const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
    dao = await TokenGatedDAO.deploy(membershipNFT.target, rolesRegistry.target);
    await dao.waitForDeployment();
  });

  it("Should allow role-based proposal creation and voting", async function () {
    // Mint NFT and assign roles
    await membershipNFT.mint(addr1.address);
    await rolesRegistry.connect(addr1).grantRole(
      membershipNFT.target,
      0,
      VOTER_ROLE,
      addr1.address,
      0,
      true,
      "0x"
    );
    await rolesRegistry.connect(addr1).grantRole(
      membershipNFT.target,
      0,
      PROPOSER_ROLE,
      addr1.address,
      0,
      true,
      "0x"
    );

    // Create proposal
    const duration = 86400; // 1 day
    await dao.connect(addr1).createProposal("Test proposal", duration);
    
    // Vote
    await dao.connect(addr1).vote(0, true);
    
    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    
    // Execute
    await dao.executeProposal(0);
    
    expect(await dao.proposals(0).executed).to.be.true;
  });

  it("Should prevent non-authorized users from proposing", async function () {
    await expect(
      dao.connect(addr2).createProposal("Unauthorized proposal", 86400)
    ).to.be.revertedWith("Not authorized to propose");
  });
});
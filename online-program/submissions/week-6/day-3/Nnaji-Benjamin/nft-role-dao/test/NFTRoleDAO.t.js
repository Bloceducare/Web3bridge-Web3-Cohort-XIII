const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("NFTRoleDAO", function () {
  let roleRegistry;
  let dao;
  let owner, member1, member2, nonMember;
  let nftContract;
  
  before(async function () {
    [owner, member1, member2, nonMember] = await ethers.getSigners();
    
    // Deploy a mock NFT contract for testing
    const MockNFT = await ethers.getContractFactory("MockNFT");
    nftContract = await MockNFT.deploy();
    await nftContract.waitForDeployment();
    
    // Mint NFTs to members
    await nftContract.connect(member1).mint(member1.address, 1);
    await nftContract.connect(member2).mint(member2.address, 2);
    await nftContract.connect(nonMember).mint(nonMember.address, 3);
  });
  
  beforeEach(async function () {
    const RoleRegistry = await ethers.getContractFactory("RoleRegistry");
    roleRegistry = await RoleRegistry.deploy();
    await roleRegistry.waitForDeployment();
    
    const NFTRoleDAO = await ethers.getContractFactory("NFTRoleDAO");
    dao = await upgrades.deployProxy(NFTRoleDAO, [await roleRegistry.getAddress()], {
      initializer: "initialize",
    });
    await dao.waitForDeployment();
    
    // Grant DAO_MEMBER role to NFT 1 and 2
    await roleRegistry.connect(member1).grantRole(
      await nftContract.getAddress(),
      1,
      await dao.DAO_MEMBER_ROLE(),
      0 // no expiration
    );
    
    await roleRegistry.connect(member2).grantRole(
      await nftContract.getAddress(),
      2,
      await dao.DAO_MEMBER_ROLE(),
      0 // no expiration
    );
  });
  
  it("should allow members to create proposals", async function () {
    await expect(
      dao.connect(member1).createProposal(
        "Test Proposal",
        await nftContract.getAddress(),
        1
      )
    ).to.emit(dao, "ProposalCreated");
  });
  
  it("should not allow non-members to create proposals", async function () {
    await expect(
      dao.connect(nonMember).createProposal(
        "Test Proposal",
        await nftContract.getAddress(),
        3
      )
    ).to.be.revertedWith("NFTRoleDAO: caller does not have DAO_MEMBER role");
  });
  
  it("should allow members to vote", async function () {
    await dao.connect(member1).createProposal(
      "Test Proposal",
      await nftContract.getAddress(),
      1
    );
    
    await expect(
      dao.connect(member2).vote(
        1,
        true,
        await nftContract.getAddress(),
        2
      )
    ).to.emit(dao, "Voted");
    
    const proposal = await dao.proposals(1);
    expect(proposal.voteCount).to.equal(1);
  });
  
  it("should not allow non-members to vote", async function () {
    await dao.connect(member1).createProposal(
      "Test Proposal",
      await nftContract.getAddress(),
      1
    );
    
    await expect(
      dao.connect(nonMember).vote(
        1,
        true,
        await nftContract.getAddress(),
        3
      )
    ).to.be.revertedWith("NFTRoleDAO: caller does not have DAO_MEMBER role");
  });
});
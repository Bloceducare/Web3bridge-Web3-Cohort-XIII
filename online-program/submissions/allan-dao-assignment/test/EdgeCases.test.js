import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Edge Cases Tests", function () {
  let roleNFT, dao, owner, user1, user2, user3;
  let VOTER_ROLE, PROPOSER_ROLE, EXECUTOR_ROLE;
  let futureTime;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

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

    futureTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now
  });

  describe("Token Transfer Edge Cases", function () {
    it("Should update role checking when token is transferred", async function () {
      // Mint token to user1 and grant role
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      
      // Verify user1 can create proposal
      await expect(dao.connect(user1).createProposal("Test Proposal"))
        .to.not.be.reverted;
      
      // Transfer token to user2
      await roleNFT.connect(user1).transferFrom(user1.address, user2.address, 0);
      
      // user1 should no longer be able to create proposals (role was tied to token ownership)
      await expect(dao.connect(user1).createProposal("Another Proposal"))
        .to.be.revertedWith("Insufficient role permissions");
      
      // user2 should be able to create proposals if they have the role
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user2.address, futureTime, true, "0x");
      await expect(dao.connect(user2).createProposal("User2 Proposal"))
        .to.not.be.reverted;
    });

    it("Should handle multiple token ownership correctly", async function () {
      // Mint multiple tokens to user1
      await roleNFT.mint(user1.address); // tokenId 0
      await roleNFT.mint(user1.address); // tokenId 1
      await roleNFT.mint(user1.address); // tokenId 2
      
      // Grant different roles to different tokens
      await roleNFT.grantRole(VOTER_ROLE, 0, user1.address, futureTime, true, "0x");
      await roleNFT.grantRole(PROPOSER_ROLE, 1, user1.address, futureTime, true, "0x");
      await roleNFT.grantRole(EXECUTOR_ROLE, 2, user1.address, futureTime, true, "0x");
      
      // user1 should be able to perform all actions
      await expect(dao.connect(user1).createProposal("Multi-role Proposal"))
        .to.not.be.reverted;
      
      await expect(dao.connect(user1).vote(0, true))
        .to.not.be.reverted;
      
      await time.increase(8 * 24 * 60 * 60);
      await expect(dao.connect(user1).executeProposal(0))
        .to.not.be.reverted;
    });
  });

  describe("Proposal Lifecycle Edge Cases", function () {
    beforeEach(async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.mint(user2.address);
      await roleNFT.mint(user3.address);
      
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      await roleNFT.grantRole(VOTER_ROLE, 1, user2.address, futureTime, true, "0x");
      await roleNFT.grantRole(EXECUTOR_ROLE, 2, user3.address, futureTime, true, "0x");
    });

    it("Should handle tie votes correctly", async function () {
      await dao.connect(user1).createProposal("Tie Vote Proposal");
      
      // Grant voter role to user1 as well
      await roleNFT.grantRole(VOTER_ROLE, 0, user1.address, futureTime, true, "0x");
      
      // Cast tie votes
      await dao.connect(user1).vote(0, true);  // For
      await dao.connect(user2).vote(0, false); // Against
      
      await time.increase(8 * 24 * 60 * 60);
      
      // Tie should result in rejection
      await expect(dao.connect(user3).executeProposal(0))
        .to.be.revertedWith("Proposal rejected");
    });

    it("Should handle proposal with only against votes", async function () {
      await dao.connect(user1).createProposal("Unpopular Proposal");
      
      await dao.connect(user2).vote(0, false);
      
      await time.increase(8 * 24 * 60 * 60);
      
      await expect(dao.connect(user3).executeProposal(0))
        .to.be.revertedWith("Proposal rejected");
    });

    it("Should handle maximum length proposal description", async function () {
      const maxDescription = "a".repeat(1000);
      
      await expect(dao.connect(user1).createProposal(maxDescription))
        .to.not.be.reverted;
      
      const proposal = await dao.getProposal(0);
      expect(proposal.description).to.equal(maxDescription);
    });
  });

  describe("Role Management Edge Cases", function () {
    it("Should handle role data correctly", async function () {
      await roleNFT.mint(user1.address);
      const customData = ethers.toUtf8Bytes("custom role data");
      
      await roleNFT.grantRole(VOTER_ROLE, 0, user1.address, futureTime, true, customData);
      
      const retrievedData = await roleNFT.roleData(VOTER_ROLE, 0, user1.address);
      expect(retrievedData).to.equal(ethers.hexlify(customData));
    });

    it("Should handle non-revocable roles correctly", async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(VOTER_ROLE, 0, user1.address, futureTime, false, "0x");

      // Verify role is not revocable
      expect(await roleNFT.isRoleRevocable(VOTER_ROLE, 0, user1.address)).to.be.false;

      // Token owner can still revoke (they have authority over their token)
      await expect(roleNFT.connect(user1).revokeRole(VOTER_ROLE, 0, user1.address))
        .to.not.be.reverted;

      // Grant again for contract owner test
      await roleNFT.grantRole(VOTER_ROLE, 0, user1.address, futureTime, false, "0x");

      // Contract owner can revoke
      await expect(roleNFT.connect(owner).revokeRole(VOTER_ROLE, 0, user1.address))
        .to.not.be.reverted;
    });

    it("Should handle role expiration edge case", async function () {
      await roleNFT.mint(user1.address);

      // Get current block timestamp and add 10 seconds
      const currentTime = await time.latest();
      const nearFutureTime = currentTime + 10;

      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, nearFutureTime, true, "0x");

      // Should work immediately
      await expect(dao.connect(user1).createProposal("Quick Proposal"))
        .to.not.be.reverted;

      // Wait for expiration
      await time.increase(15);

      // Should fail after expiration
      await expect(dao.connect(user1).createProposal("Expired Proposal"))
        .to.be.revertedWith("Insufficient role permissions");
    });
  });

  describe("Gas Optimization Edge Cases", function () {
    it("Should handle user with many tokens efficiently", async function () {
      // Mint many tokens to user1
      for (let i = 0; i < 10; i++) {
        await roleNFT.mint(user1.address);
      }
      
      // Grant role to one token
      await roleNFT.grantRole(PROPOSER_ROLE, 5, user1.address, futureTime, true, "0x");
      
      // Should still work efficiently
      await expect(dao.connect(user1).createProposal("Many Tokens Proposal"))
        .to.not.be.reverted;
    });

    it("Should handle empty token array gracefully", async function () {
      // user1 has no tokens
      await expect(dao.connect(user1).createProposal("No Tokens Proposal"))
        .to.be.revertedWith("Insufficient role permissions");
    });
  });

  describe("Contract State Edge Cases", function () {
    it("Should handle proposal counter correctly", async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      
      // Create multiple proposals
      await dao.connect(user1).createProposal("Proposal 0");
      await dao.connect(user1).createProposal("Proposal 1");
      await dao.connect(user1).createProposal("Proposal 2");
      
      expect(await dao.proposalCount()).to.equal(3);
      
      const proposal0 = await dao.getProposal(0);
      const proposal1 = await dao.getProposal(1);
      const proposal2 = await dao.getProposal(2);
      
      expect(proposal0.description).to.equal("Proposal 0");
      expect(proposal1.description).to.equal("Proposal 1");
      expect(proposal2.description).to.equal("Proposal 2");
    });

    it("Should handle DAO contract address update", async function () {
      // Deploy new DAO
      const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
      const newDao = await TokenGatedDAO.deploy(await roleNFT.getAddress());
      
      // Update DAO address
      await roleNFT.setDAOContract(await newDao.getAddress());
      
      // Mint token and grant role
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      
      // Should work with new DAO
      await expect(newDao.connect(user1).createProposal("New DAO Proposal"))
        .to.not.be.reverted;
    });
  });
});

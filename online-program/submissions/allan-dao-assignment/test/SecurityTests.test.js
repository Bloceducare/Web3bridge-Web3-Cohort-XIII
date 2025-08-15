import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Security Tests", function () {
  let roleNFT, dao, owner, user1, user2, attacker;
  let VOTER_ROLE, PROPOSER_ROLE, EXECUTOR_ROLE;
  let futureTime;

  beforeEach(async function () {
    [owner, user1, user2, attacker] = await ethers.getSigners();

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

  describe("Input Validation Security", function () {
    it("Should reject zero address in DAO constructor", async function () {
      const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
      await expect(TokenGatedDAO.deploy(ethers.ZeroAddress))
        .to.be.revertedWith("RoleNFT address cannot be zero");
    });

    it("Should reject empty proposal description", async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      
      await expect(dao.connect(user1).createProposal(""))
        .to.be.revertedWith("Proposal description cannot be empty");
    });

    it("Should reject overly long proposal description", async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      
      const longDescription = "a".repeat(1001);
      await expect(dao.connect(user1).createProposal(longDescription))
        .to.be.revertedWith("Proposal description too long");
    });

    it("Should reject voting on non-existent proposal", async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(VOTER_ROLE, 0, user1.address, futureTime, true, "0x");
      
      await expect(dao.connect(user1).vote(999, true))
        .to.be.revertedWith("Proposal does not exist");
    });

    it("Should reject execution of non-existent proposal", async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(EXECUTOR_ROLE, 0, user1.address, futureTime, true, "0x");
      
      await expect(dao.connect(user1).executeProposal(999))
        .to.be.revertedWith("Proposal does not exist");
    });
  });

  describe("Role Granting Security", function () {
    it("Should reject granting role to zero address", async function () {
      await roleNFT.mint(user1.address);
      
      await expect(roleNFT.connect(user1).grantRole(
        VOTER_ROLE, 0, ethers.ZeroAddress, futureTime, true, "0x"
      )).to.be.revertedWith("Cannot grant role to zero address");
    });

    it("Should reject granting role with past expiration date", async function () {
      await roleNFT.mint(user1.address);
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      await expect(roleNFT.connect(user1).grantRole(
        VOTER_ROLE, 0, user1.address, pastTime, true, "0x"
      )).to.be.revertedWith("Expiration date must be in the future");
    });

    it("Should prevent non-owner from granting role to different address", async function () {
      await roleNFT.mint(user1.address);
      
      await expect(roleNFT.connect(user1).grantRole(
        VOTER_ROLE, 0, user2.address, futureTime, true, "0x"
      )).to.be.revertedWith("Can only grant role to token owner");
    });

    it("Should allow contract owner to grant role to any address", async function () {
      await roleNFT.mint(user1.address);
      
      await expect(roleNFT.connect(owner).grantRole(
        VOTER_ROLE, 0, user2.address, futureTime, true, "0x"
      )).to.not.be.reverted;
      
      expect(await roleNFT.hasRole(VOTER_ROLE, 0, user2.address)).to.be.true;
    });
  });

  describe("Role Revocation Security", function () {
    beforeEach(async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(VOTER_ROLE, 0, user1.address, futureTime, true, "0x");
    });

    it("Should allow token owner to revoke role", async function () {
      await expect(roleNFT.connect(user1).revokeRole(VOTER_ROLE, 0, user1.address))
        .to.not.be.reverted;
      
      expect(await roleNFT.hasRole(VOTER_ROLE, 0, user1.address)).to.be.false;
    });

    it("Should allow contract owner to revoke role", async function () {
      await expect(roleNFT.connect(owner).revokeRole(VOTER_ROLE, 0, user1.address))
        .to.not.be.reverted;
      
      expect(await roleNFT.hasRole(VOTER_ROLE, 0, user1.address)).to.be.false;
    });

    it("Should allow role holder to revoke their own revocable role", async function () {
      await expect(roleNFT.connect(user1).revokeRole(VOTER_ROLE, 0, user1.address))
        .to.not.be.reverted;
    });

    it("Should reject unauthorized role revocation", async function () {
      await expect(roleNFT.connect(attacker).revokeRole(VOTER_ROLE, 0, user1.address))
        .to.be.revertedWith("Not authorized to revoke");
    });

    it("Should reject revoking non-existent role", async function () {
      await expect(roleNFT.connect(user1).revokeRole(PROPOSER_ROLE, 0, user1.address))
        .to.be.revertedWith("Role does not exist");
    });
  });

  describe("Voting Security", function () {
    beforeEach(async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.mint(user2.address);
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      await roleNFT.grantRole(VOTER_ROLE, 1, user2.address, futureTime, true, "0x");
      
      await dao.connect(user1).createProposal("Test Proposal");
    });

    it("Should reject voting on executed proposal", async function () {
      await roleNFT.mint(user1.address); // tokenId 2
      await roleNFT.grantRole(EXECUTOR_ROLE, 2, user1.address, futureTime, true, "0x");
      await roleNFT.grantRole(VOTER_ROLE, 2, user1.address, futureTime, true, "0x");

      await dao.connect(user2).vote(0, true);
      await time.increase(8 * 24 * 60 * 60); // Move past deadline
      await dao.connect(user1).executeProposal(0);

      // Try to vote after execution - should fail because proposal is executed
      await expect(dao.connect(user1).vote(0, false))
        .to.be.revertedWith("Proposal already executed");
    });

    it("Should reject execution with no votes (proposal rejected)", async function () {
      await roleNFT.mint(user1.address); // tokenId 2
      await roleNFT.grantRole(EXECUTOR_ROLE, 2, user1.address, futureTime, true, "0x");

      await time.increase(8 * 24 * 60 * 60); // Move past deadline

      // No votes means 0 for, 0 against, so forVotes > againstVotes is false
      await expect(dao.connect(user1).executeProposal(0))
        .to.be.revertedWith("Proposal rejected");
    });
  });

  describe("Access Control Security", function () {
    it("Should prevent unauthorized proposal creation", async function () {
      await expect(dao.connect(attacker).createProposal("Malicious Proposal"))
        .to.be.revertedWith("Insufficient role permissions");
    });

    it("Should prevent unauthorized voting", async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      await dao.connect(user1).createProposal("Test Proposal");
      
      await expect(dao.connect(attacker).vote(0, true))
        .to.be.revertedWith("Insufficient role permissions");
    });

    it("Should prevent unauthorized proposal execution", async function () {
      await roleNFT.mint(user1.address);
      await roleNFT.mint(user2.address);
      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, futureTime, true, "0x");
      await roleNFT.grantRole(VOTER_ROLE, 1, user2.address, futureTime, true, "0x");
      
      await dao.connect(user1).createProposal("Test Proposal");
      await dao.connect(user2).vote(0, true);
      await time.increase(8 * 24 * 60 * 60);
      
      await expect(dao.connect(attacker).executeProposal(0))
        .to.be.revertedWith("Insufficient role permissions");
    });
  });

  describe("Role Expiration Security", function () {
    it("Should reject actions with expired roles", async function () {
      await roleNFT.mint(user1.address);

      // Get current block timestamp and add 1 hour
      const currentTime = await time.latest();
      const shortTime = currentTime + 3600; // 1 hour from now

      await roleNFT.grantRole(PROPOSER_ROLE, 0, user1.address, shortTime, true, "0x");

      // Move time forward to expire the role
      await time.increase(7200); // 2 hours

      await expect(dao.connect(user1).createProposal("Test Proposal"))
        .to.be.revertedWith("Insufficient role permissions");
    });
  });
});

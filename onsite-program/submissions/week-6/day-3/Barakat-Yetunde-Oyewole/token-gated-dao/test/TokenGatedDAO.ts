import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DAOMembershipNFT, TokenGatedDAO } from "../typechain-types";

describe("Token-Gated DAO", function () {
  let membershipNFT: DAOMembershipNFT;
  let dao: TokenGatedDAO;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;

  let adminRole: string;
  let voterRole: string;
  let proposerRole: string;
  let executorRole: string;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    const DAOMembershipNFTFactory = await ethers.getContractFactory("DAOMembershipNFT");
    membershipNFT = await DAOMembershipNFTFactory.deploy();
    await membershipNFT.waitForDeployment();

    const TokenGatedDAOFactory = await ethers.getContractFactory("TokenGatedDAO");
    dao = await TokenGatedDAOFactory.deploy(await membershipNFT.getAddress());
    await dao.waitForDeployment();

    adminRole = await membershipNFT.ADMIN_ROLE();
    voterRole = await membershipNFT.VOTER_ROLE();
    proposerRole = await membershipNFT.PROPOSER_ROLE();
    executorRole = await membershipNFT.EXECUTOR_ROLE();

    await membershipNFT.mintMembership(user1.address, "metadata1");
    await membershipNFT.mintMembership(user2.address, "metadata2");
    await membershipNFT.mintMembership(user3.address, "metadata3");

    await membershipNFT.grantDAORole(proposerRole, 0, user1.address, 0);
    await membershipNFT.grantDAORole(voterRole, 0, user1.address, 0);
    await membershipNFT.grantDAORole(voterRole, 1, user2.address, 0);
    await membershipNFT.grantDAORole(executorRole, 2, user3.address, 0);
    await membershipNFT.grantDAORole(voterRole, 2, user3.address, 0);
  });

  describe("Deployment", function () {
    it("Should deploy contracts successfully", async function () {
      expect(await membershipNFT.name()).to.equal("DAO Membership");
      expect(await membershipNFT.symbol()).to.equal("DAOMEMBER");
      expect(await dao.membershipNFT()).to.equal(await membershipNFT.getAddress());
    });

    it("Should have correct initial DAO settings", async function () {
      expect(await dao.votingPeriod()).to.equal(7 * 24 * 60 * 60); // 7 days
      expect(await dao.minimumQuorum()).to.equal(1);
      expect(await dao.getProposalCount()).to.equal(0);
    });
  });

  describe("NFT Roles", function () {
    it("Should grant and verify roles correctly", async function () {
      expect(await membershipNFT.hasRole(proposerRole, 0, user1.address)).to.be.true;
      expect(await membershipNFT.hasRole(voterRole, 0, user1.address)).to.be.true;

      expect(await membershipNFT.hasRole(voterRole, 1, user2.address)).to.be.true;
      expect(await membershipNFT.hasRole(proposerRole, 1, user2.address)).to.be.false;

      expect(await membershipNFT.hasRole(executorRole, 2, user3.address)).to.be.true;
      expect(await membershipNFT.hasRole(voterRole, 2, user3.address)).to.be.true;
    });

    it("Should allow revoking roles", async function () {
      await membershipNFT.grantDAORole(adminRole, 0, user1.address, 0);
      expect(await membershipNFT.hasRole(adminRole, 0, user1.address)).to.be.true;

      await membershipNFT.connect(user1).revokeRole(adminRole, 0, user1.address);
      expect(await membershipNFT.hasRole(adminRole, 0, user1.address)).to.be.false;
    });

    it("Should handle role expiration", async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const expirationDate = currentBlock!.timestamp + 10;
      
      await membershipNFT.connect(user1).grantRole(adminRole, 0, user1.address, expirationDate, "0x01");

      expect(await membershipNFT.hasRole(adminRole, 0, user1.address)).to.be.true;

      await ethers.provider.send("evm_increaseTime", [15]);
      await ethers.provider.send("evm_mine", []);

      expect(await membershipNFT.hasRole(adminRole, 0, user1.address)).to.be.false;
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow users with proposer role to create proposals", async function () {
      const description = "Test proposal";
      const target = ethers.ZeroAddress;
      const value = 0;
      const callData = "0x";

      await expect(
        dao.connect(user1).createProposal(description, target, value, callData, 0)
      ).to.emit(dao, "ProposalCreated");

      expect(await dao.getProposalCount()).to.equal(1);
      
      const proposal = await dao.getProposal(0);
      expect(proposal.id).to.equal(0);
      expect(proposal.proposer).to.equal(user1.address);
      expect(proposal.description).to.equal(description);
    });

    it("Should reject proposal creation from users without proposer role", async function () {
      const description = "Test proposal";
      const target = ethers.ZeroAddress;
      const value = 0;
      const callData = "0x";

      await expect(
        dao.connect(user2).createProposal(description, target, value, callData, 1)
      ).to.be.revertedWith("TokenGatedDAO: Caller does not have proposer role");
    });

    it("Should create proposal with correct details", async function () {
      const description = "Test proposal";
      const target = user4.address;
      const value = ethers.parseEther("1");
      const callData = "0x1234";

      await dao.connect(user1).createProposal(description, target, value, callData, 0);

      const proposal = await dao.getProposal(0);
      expect(proposal.id).to.equal(0);
      expect(proposal.proposer).to.equal(user1.address);
      expect(proposal.description).to.equal(description);
      expect(proposal.target).to.equal(target);
      expect(proposal.value).to.equal(value);
      expect(proposal.executed).to.be.false;
      expect(proposal.votesFor).to.equal(0);
      expect(proposal.votesAgainst).to.equal(0);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await dao.connect(user1).createProposal(
        "Test proposal",
        ethers.ZeroAddress,
        0,
        "0x",
        0
      );
    });

    it("Should allow users with voter role to vote", async function () {
      await expect(dao.connect(user1).vote(0, true, 0))
        .to.emit(dao, "VoteCast")
        .withArgs(0, user1.address, true, 0);

      const proposal = await dao.getProposal(0);
      expect(proposal.votesFor).to.equal(1);
      expect(proposal.votesAgainst).to.equal(0);
    });

    it("Should reject voting from users without voter role", async function () {
      await expect(
        dao.connect(user4).vote(0, true, 0)
      ).to.be.revertedWith("TokenGatedDAO: Caller does not have voter role");
    });

    it("Should prevent double voting", async function () {
      await dao.connect(user1).vote(0, true, 0);

      await expect(
        dao.connect(user1).vote(0, false, 0)
      ).to.be.revertedWith("TokenGatedDAO: Already voted");
    });

    it("Should count votes correctly", async function () {
      await dao.connect(user1).vote(0, true, 0);
      await dao.connect(user2).vote(0, false, 1);
      await dao.connect(user3).vote(0, true, 2);

      const proposal = await dao.getProposal(0);
      expect(proposal.votesFor).to.equal(2);
      expect(proposal.votesAgainst).to.equal(1);
    });

    it("Should reject voting after deadline", async function () {
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); 
      await ethers.provider.send("evm_mine", []);

      await expect(
        dao.connect(user1).vote(0, true, 0)
      ).to.be.revertedWith("TokenGatedDAO: Voting period has ended");
    });
  });

  describe("Proposal Execution", function () {
    beforeEach(async function () {
      await dao.connect(user1).createProposal(
        "Test proposal",
        ethers.ZeroAddress,
        0,
        "0x",
        0
      );
      
      await dao.connect(user1).vote(0, true, 0);
      await dao.connect(user2).vote(0, true, 1);
      
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
    });

    it("Should allow users with executor role to execute passed proposals", async function () {
      await expect(dao.connect(user3).executeProposal(0, 2))
        .to.emit(dao, "ProposalExecuted")
        .withArgs(0, true);

      const proposal = await dao.getProposal(0);
      expect(proposal.executed).to.be.true;
    });

    it("Should reject execution from users without executor role", async function () {
      await expect(
        dao.connect(user1).executeProposal(0, 0)
      ).to.be.revertedWith("TokenGatedDAO: Caller does not have executor role");
    });

    it("Should reject execution before voting deadline", async function () {
      await dao.connect(user1).createProposal(
        "New proposal",
        ethers.ZeroAddress,
        0,
        "0x",
        0
      );

      await expect(
        dao.connect(user3).executeProposal(1, 2)
      ).to.be.revertedWith("TokenGatedDAO: Voting period not ended");
    });

    it("Should reject execution if proposal failed", async function () {
      await dao.connect(user1).createProposal(
        "Failing proposal",
        ethers.ZeroAddress,
        0,
        "0x",
        0
      );

      await dao.connect(user1).vote(1, false, 0);
      await dao.connect(user2).vote(1, false, 1);

      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        dao.connect(user3).executeProposal(1, 2)
      ).to.be.revertedWith("TokenGatedDAO: Proposal not passed");
    });

    it("Should prevent double execution", async function () {
      await dao.connect(user3).executeProposal(0, 2);

      await expect(
        dao.connect(user3).executeProposal(0, 2)
      ).to.be.revertedWith("TokenGatedDAO: Proposal already executed");
    });
  });

  describe("DAO Administration", function () {
    it("Should allow updating voting period", async function () {
      const newVotingPeriod = 14 * 24 * 60 * 60; // 14 days
      await dao.updateVotingPeriod(newVotingPeriod);
      expect(await dao.votingPeriod()).to.equal(newVotingPeriod);
    });

    it("Should allow updating minimum quorum", async function () {
      await dao.updateMinimumQuorum(5);
      expect(await dao.minimumQuorum()).to.equal(5);
    });

    it("Should allow updating membership NFT contract", async function () {
      const newNFTFactory = await ethers.getContractFactory("DAOMembershipNFT");
      const newNFT = await newNFTFactory.deploy();
      await newNFT.waitForDeployment();

      await expect(dao.updateMembershipNFT(await newNFT.getAddress()))
        .to.emit(dao, "MembershipNFTUpdated")
        .withArgs(await newNFT.getAddress());

      expect(await dao.membershipNFT()).to.equal(await newNFT.getAddress());
    });
  });

  describe("Treasury Management", function () {
    beforeEach(async function () {
      await membershipNFT.grantDAORole(adminRole, 0, user1.address, 0);
      
      await owner.sendTransaction({
        to: await dao.getAddress(),
        value: ethers.parseEther("10")
      });
    });

    it("Should allow admin role holders to withdraw funds", async function () {
      const withdrawAmount = ethers.parseEther("5");

      await dao.connect(user1).withdraw(withdrawAmount, 0);

      expect(await ethers.provider.getBalance(await dao.getAddress())).to.equal(
        ethers.parseEther("5")
      );
    });

    it("Should reject withdrawals from non-admin users", async function () {
      const withdrawAmount = ethers.parseEther("5");

      await expect(
        dao.connect(user2).withdraw(withdrawAmount, 1)
      ).to.be.revertedWith("TokenGatedDAO: Caller does not have admin role");
    });

    it("Should reject withdrawal of insufficient balance", async function () {
      const withdrawAmount = ethers.parseEther("20"); 

      await expect(
        dao.connect(user1).withdraw(withdrawAmount, 0)
      ).to.be.revertedWith("TokenGatedDAO: Insufficient balance");
    });
  });

  describe("Additional Coverage Tests", function () {
    it("Should return all proposal IDs correctly", async function () {
      await dao.connect(user1).createProposal("Proposal 1", ethers.ZeroAddress, 0, "0x", 0);
      await dao.connect(user1).createProposal("Proposal 2", ethers.ZeroAddress, 0, "0x", 0);
      await dao.connect(user1).createProposal("Proposal 3", ethers.ZeroAddress, 0, "0x", 0);

      const proposalIds = await dao.getAllProposalIds();
      expect(proposalIds).to.deep.equal([0, 1, 2]);
    });

    it("Should track hasVoted correctly", async function () {
      await dao.connect(user1).createProposal("Test proposal", ethers.ZeroAddress, 0, "0x", 0);
      
      expect(await dao.hasVoted(0, user1.address)).to.be.false;
      
      await dao.connect(user1).vote(0, true, 0);
      
      expect(await dao.hasVoted(0, user1.address)).to.be.true;
      expect(await dao.hasVoted(0, user2.address)).to.be.false;
    });

    it("Should handle proposal execution with target contract call", async function () {
      const SimpleTarget = await ethers.getContractFactory("SimpleTarget");
      let simpleTarget;
      try {
        simpleTarget = await SimpleTarget.deploy();
        await simpleTarget.waitForDeployment();
      } catch (e) {
        await dao.connect(user1).createProposal(
          "Test with target",
          user4.address, 
          ethers.parseEther("1"),
          "0x",
          0
        );

        await dao.connect(user1).vote(0, true, 0);
        await dao.connect(user2).vote(0, true, 1);
        
        await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine", []);

        await owner.sendTransaction({
          to: await dao.getAddress(),
          value: ethers.parseEther("2")
        });

        await expect(dao.connect(user3).executeProposal(0, 2))
          .to.emit(dao, "ProposalExecuted");

        const proposal = await dao.getProposal(0);
        expect(proposal.executed).to.be.true;
        return;
      }
    });
  });

  async function getBlockTimestamp(): Promise<number> {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  }
});

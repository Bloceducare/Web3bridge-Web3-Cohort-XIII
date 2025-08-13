import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TokenGatedDAO, DAOMembershipNFT } from "../typechain-types";

describe("TokenGatedDAO Edge Cases", function () {
  let dao: TokenGatedDAO;
  let nft: DAOMembershipNFT;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let admin: SignerWithAddress;
  let voter: SignerWithAddress;
  let proposer: SignerWithAddress;
  let executor: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, admin, voter, proposer, executor] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("DAOMembershipNFT");
    nft = await NFTFactory.deploy();
    await nft.waitForDeployment();

    const TokenGatedDAOFactory = await ethers.getContractFactory("TokenGatedDAO");
    dao = await TokenGatedDAOFactory.deploy(await nft.getAddress());
    await dao.waitForDeployment();

    await nft.mintMembership(admin.address, "admin-metadata");
    await nft.mintMembership(voter.address, "voter-metadata");
    await nft.mintMembership(proposer.address, "proposer-metadata");
    await nft.mintMembership(executor.address, "executor-metadata");

    const adminRole = await nft.ADMIN_ROLE();
    const voterRole = await nft.VOTER_ROLE();
    const proposerRole = await nft.PROPOSER_ROLE();
    const executorRole = await nft.EXECUTOR_ROLE();

    await nft.grantDAORole(adminRole, 0, admin.address, 0);
    await nft.grantDAORole(voterRole, 1, voter.address, 0);
    await nft.grantDAORole(proposerRole, 2, proposer.address, 0);
    await nft.grantDAORole(executorRole, 3, executor.address, 0);
  });

  describe("Error Handling in Role Checks", function () {
    it("Should handle proposer role check failures gracefully", async function () {
      await expect(
        dao.connect(user1).createProposal(
          "Test proposal",
          await dao.getAddress(),
          0,
          "0x",
          0
        )
      ).to.be.reverted;
    });

    it("Should handle voter role check failures gracefully", async function () {
      await dao.connect(proposer).createProposal(
        "Test proposal",
        await dao.getAddress(),
        0,
        "0x",
        2
      );

      await expect(
        dao.connect(user1).vote(0, true, 0)
      ).to.be.reverted;
    });

    it("Should handle executor role check failures gracefully", async function () {
      await expect(
        dao.connect(user1).executeProposal(0, 0)
      ).to.be.reverted;
    });

    it("Should handle admin role check failures gracefully", async function () {
      await expect(
        dao.connect(user1).withdraw(ethers.parseEther("1"), 0)
      ).to.be.reverted;
    });
  });

  describe("View Functions Coverage", function () {
    it("Should return empty proposal IDs array initially", async function () {
      const proposalIds = await dao.getAllProposalIds();
      expect(proposalIds).to.deep.equal([]);
    });

    it("Should return false for hasVoted with non-existent proposal", async function () {
      const hasVoted = await dao.hasVoted(999, user1.address);
      expect(hasVoted).to.be.false;
    });

    it("Should return 0 for proposal count initially", async function () {
      const count = await dao.getProposalCount();
      expect(count).to.equal(0);
    });
  });

  describe("Contract Receive Function", function () {
    it("Should receive ETH successfully", async function () {
      const amount = ethers.parseEther("1");
      
      await expect(
        owner.sendTransaction({
          to: await dao.getAddress(),
          value: amount
        })
      ).to.not.be.reverted;

      const balance = await ethers.provider.getBalance(await dao.getAddress());
      expect(balance).to.equal(amount);
    });
  });

  describe("Additional Error Conditions", function () {
    it("Should reject proposal with non-existent ID in getProposal", async function () {
      const proposal = await dao.getProposal(999);
      expect(proposal.id).to.equal(0);
      expect(proposal.proposer).to.equal(ethers.ZeroAddress);
      expect(proposal.description).to.equal("");
    });

    it("Should handle governance parameter updates by owner", async function () {
      await expect(
        dao.connect(user1).updateVotingPeriod(7200)
      ).to.be.reverted;
      
      await expect(
        dao.connect(user1).updateMinimumQuorum(100)
      ).to.be.reverted;
      
      await dao.connect(owner).updateVotingPeriod(7200);
      expect(await dao.votingPeriod()).to.equal(7200);
      
      await dao.connect(owner).updateMinimumQuorum(100);
      expect(await dao.minimumQuorum()).to.equal(100);
    });

    it("Should handle external contract call in proposal execution", async function () {
      const SimpleTargetFactory = await ethers.getContractFactory("SimpleTarget");
      const target = await SimpleTargetFactory.deploy();
      await target.waitForDeployment();

      const calldata = target.interface.encodeFunctionData("setValue", [42]);
      
      await dao.connect(proposer).createProposal(
        "Set value to 42",
        await target.getAddress(),
        0,
        calldata,
        2
      );

      await dao.connect(voter).vote(0, true, 1);
      
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await dao.connect(executor).executeProposal(0, 3);
      
      expect(await target.value()).to.equal(42);
      expect(await target.executed()).to.be.true;
    });

    it("Should handle zero voting period validation", async function () {
      await expect(
        dao.connect(owner).updateVotingPeriod(0)
      ).to.be.revertedWith("TokenGatedDAO: Voting period must be greater than 0");
    });

    it("Should handle insufficient balance withdrawal", async function () {
      await owner.sendTransaction({
        to: await dao.getAddress(),
        value: ethers.parseEther("1")
      });
      
      await expect(
        dao.connect(admin).withdraw(ethers.parseEther("2"), 0)
      ).to.be.revertedWith("TokenGatedDAO: Insufficient balance");
    });

    it("Should handle duplicate votes by same user", async function () {
      await dao.connect(proposer).createProposal(
        "Test proposal",
        await dao.getAddress(),
        0,
        "0x",
        2
      );
      
      await dao.connect(voter).vote(0, true, 1);
      
      await expect(
        dao.connect(voter).vote(0, false, 1)
      ).to.be.revertedWith("TokenGatedDAO: Already voted");
    });

    it("Should handle voting on non-existent proposal", async function () {
      await expect(
        dao.connect(voter).vote(999, true, 1)
      ).to.be.revertedWith("TokenGatedDAO: Proposal does not exist");
    });

    it("Should handle executing non-existent proposal", async function () {
      await expect(
        dao.connect(executor).executeProposal(999, 3)
      ).to.be.revertedWith("TokenGatedDAO: Proposal does not exist");
    });

    it("Should handle voting after voting period ended", async function () {
      await dao.connect(proposer).createProposal(
        "Test proposal",
        await dao.getAddress(),
        0,
        "0x",
        2
      );

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(
        dao.connect(voter).vote(0, true, 1)
      ).to.be.revertedWith("TokenGatedDAO: Voting period has ended");
    });

    it("Should handle executing proposal before voting period ends", async function () {
      await dao.connect(proposer).createProposal(
        "Test proposal",
        await dao.getAddress(),
        0,
        "0x",
        2
      );
      
      await expect(
        dao.connect(executor).executeProposal(0, 3)
      ).to.be.revertedWith("TokenGatedDAO: Voting period not ended");
    });

    it("Should handle executing already executed proposal", async function () {
      await dao.connect(proposer).createProposal(
        "Test proposal",
        await dao.getAddress(),
        0,
        "0x",
        2
      );
      
      await dao.connect(voter).vote(0, true, 1);
      
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await dao.connect(executor).executeProposal(0, 3);
      
      await expect(
        dao.connect(executor).executeProposal(0, 3)
      ).to.be.revertedWith("TokenGatedDAO: Proposal already executed");
    });
  });
});

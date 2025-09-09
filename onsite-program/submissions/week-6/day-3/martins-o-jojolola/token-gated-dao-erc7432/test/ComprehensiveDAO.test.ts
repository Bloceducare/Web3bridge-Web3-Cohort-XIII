import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Comprehensive Token-Gated DAO Coverage Tests", function () {
  async function deployTokenGatedDAOFixture() {
    const [owner, user1, user2, user3, user4] = await ethers.getSigners();

    const RoleBasedNFT = await ethers.getContractFactory("RoleBasedNFT");
    const roleBasedNFT = await RoleBasedNFT.deploy("DAO Membership NFT", "DAONFT");
    await roleBasedNFT.waitForDeployment();

    const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
    const tokenGatedDAO = await TokenGatedDAO.deploy(await roleBasedNFT.getAddress());
    await tokenGatedDAO.waitForDeployment();

    const DAO_MEMBER_ROLE = await roleBasedNFT.DAO_MEMBER_ROLE();
    const DAO_ADMIN_ROLE = await roleBasedNFT.DAO_ADMIN_ROLE();
    const PROPOSAL_CREATOR_ROLE = await roleBasedNFT.PROPOSAL_CREATOR_ROLE();
    const VOTER_ROLE = await roleBasedNFT.VOTER_ROLE();

    return {
      roleBasedNFT,
      tokenGatedDAO,
      owner,
      user1,
      user2,
      user3,
      user4,
      DAO_MEMBER_ROLE,
      DAO_ADMIN_ROLE,
      PROPOSAL_CREATOR_ROLE,
      VOTER_ROLE
    };
  }

  describe("RoleBasedNFT - Missing Coverage", function () {
    describe("Role Data Functions", function () {
      it("Should return correct role data", async function () {
        const { roleBasedNFT, user1, user2, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        const tokenId = 0;
        
        const testData = ethers.toUtf8Bytes("Test role data");
        await roleBasedNFT.connect(user1).grantRole(
          DAO_MEMBER_ROLE,
          tokenId,
          user2.address,
          123456789,
          true,
          testData
        );

        const roleInfo = await roleBasedNFT.roleData(DAO_MEMBER_ROLE, tokenId, user2.address);
        expect(roleInfo.recipient).to.equal(user2.address);
        expect(roleInfo.expirationDate).to.equal(123456789);
        expect(roleInfo.revocable).to.be.true;
        expect(roleInfo.data).to.equal(ethers.hexlify(testData));
      });

      it("Should revert roleData for non-existent token", async function () {
        const { roleBasedNFT, user1, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await expect(roleBasedNFT.roleData(DAO_MEMBER_ROLE, 999, user1.address))
          .to.be.revertedWith("RoleBasedNFT: Token does not exist");
      });

      it("Should return correct role expiration date", async function () {
        const { roleBasedNFT, user1, user2, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        const tokenId = 0;
        const expirationDate = 987654321;
        
        await roleBasedNFT.connect(user1).grantRole(
          DAO_MEMBER_ROLE,
          tokenId,
          user2.address,
          expirationDate,
          true,
          "0x"
        );

        const retrievedExpiration = await roleBasedNFT.roleExpirationDate(DAO_MEMBER_ROLE, tokenId, user2.address);
        expect(retrievedExpiration).to.equal(expirationDate);
      });

      it("Should revert roleExpirationDate for non-existent token", async function () {
        const { roleBasedNFT, user1, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await expect(roleBasedNFT.roleExpirationDate(DAO_MEMBER_ROLE, 999, user1.address))
          .to.be.revertedWith("RoleBasedNFT: Token does not exist");
      });

      it("Should return correct role revocability", async function () {
        const { roleBasedNFT, user1, user2, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        const tokenId = 0;
        
        await roleBasedNFT.connect(user1).grantRole(
          DAO_MEMBER_ROLE,
          tokenId,
          user2.address,
          0,
          false,
          "0x"
        );

        const isRevocable = await roleBasedNFT.isRoleRevocable(DAO_MEMBER_ROLE, tokenId, user2.address);
        expect(isRevocable).to.be.false;
      });

      it("Should revert isRoleRevocable for non-existent token", async function () {
        const { roleBasedNFT, user1, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await expect(roleBasedNFT.isRoleRevocable(DAO_MEMBER_ROLE, 999, user1.address))
          .to.be.revertedWith("RoleBasedNFT: Token does not exist");
      });

      it("Should handle hasRole for non-existent token", async function () {
        const { roleBasedNFT, user1, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        const hasRole = await roleBasedNFT.hasRole(DAO_MEMBER_ROLE, 999, user1.address);
        expect(hasRole).to.be.false;
      });

      it("Should handle hasRole for non-assigned role", async function () {
        const { roleBasedNFT, user1, user2, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        const tokenId = 0;
        
        const hasRole = await roleBasedNFT.hasRole(DAO_MEMBER_ROLE, tokenId, user2.address);
        expect(hasRole).to.be.false;
      });
    });

    describe("Edge Cases and Error Conditions", function () {
      it("Should handle grant role to non-existent token", async function () {
        const { roleBasedNFT, DAO_MEMBER_ROLE, user1 } = await loadFixture(deployTokenGatedDAOFixture);
        
        await expect(roleBasedNFT.grantRole(DAO_MEMBER_ROLE, 999, user1.address, 0, true, "0x"))
          .to.be.revertedWith("RoleBasedNFT: Token does not exist");
      });

      it("Should handle revoke role from non-existent token", async function () {
        const { roleBasedNFT, DAO_MEMBER_ROLE, user1 } = await loadFixture(deployTokenGatedDAOFixture);
        
        await expect(roleBasedNFT.revokeRole(DAO_MEMBER_ROLE, 999, user1.address))
          .to.be.revertedWith("RoleBasedNFT: Token does not exist");
      });

      it("Should handle revoke non-assigned role", async function () {
        const { roleBasedNFT, user1, user2, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        const tokenId = 0;
        
        await expect(roleBasedNFT.connect(user1).revokeRole(DAO_MEMBER_ROLE, tokenId, user2.address))
          .to.be.revertedWith("RoleBasedNFT: Role not assigned");
      });

      it("Should handle unauthorized revoke attempt", async function () {
        const { roleBasedNFT, user1, user2, user3, DAO_MEMBER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        const tokenId = 0;
        
        await roleBasedNFT.connect(user1).grantRole(DAO_MEMBER_ROLE, tokenId, user2.address, 0, true, "0x");
        
        await expect(roleBasedNFT.connect(user3).revokeRole(DAO_MEMBER_ROLE, tokenId, user2.address))
          .to.be.revertedWith("RoleBasedNFT: Not authorized to revoke role");
      });
    });
  });

  describe("TokenGatedDAO - Missing Coverage", function () {
    describe("Proposal Cancellation", function () {
      it("Should allow proposer to cancel their own proposal", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await expect(tokenGatedDAO.connect(user1).cancelProposal(0))
          .to.emit(tokenGatedDAO, "ProposalCancelled")
          .withArgs(0);
        
        const proposal = await tokenGatedDAO.getProposal(0);
        expect(proposal.cancelled).to.be.true;
      });

      it("Should allow admin to cancel any proposal", async function () {
        const { roleBasedNFT, tokenGatedDAO, owner, user1, DAO_ADMIN_ROLE, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(owner.address);
        await roleBasedNFT.grantRole(DAO_ADMIN_ROLE, 0, owner.address, 0, true, "0x");
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 1, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 1, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await expect(tokenGatedDAO.connect(owner).cancelProposal(0))
          .to.emit(tokenGatedDAO, "ProposalCancelled")
          .withArgs(0);
        
        const proposal = await tokenGatedDAO.getProposal(0);
        expect(proposal.cancelled).to.be.true;
      });

      it("Should not allow unauthorized user to cancel proposal", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, user2, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await expect(tokenGatedDAO.connect(user2).cancelProposal(0))
          .to.be.revertedWith("TokenGatedDAO: Not authorized to cancel");
      });

      it("Should handle cancelling invalid proposal ID", async function () {
        const { tokenGatedDAO, user1 } = await loadFixture(deployTokenGatedDAOFixture);
        
        await expect(tokenGatedDAO.connect(user1).cancelProposal(999))
          .to.be.revertedWith("TokenGatedDAO: Invalid proposal ID");
      });
    });

    describe("Proposal Execution", function () {
      it("Should not allow executing invalid proposal ID", async function () {
        const { tokenGatedDAO, owner, DAO_ADMIN_ROLE, roleBasedNFT } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(owner.address);
        await roleBasedNFT.grantRole(DAO_ADMIN_ROLE, 0, owner.address, 0, true, "0x");
        
        await expect(tokenGatedDAO.connect(owner).executeProposal(999))
          .to.be.revertedWith("TokenGatedDAO: Invalid proposal ID");
      });

      it("Should not allow executing non-succeeded proposal", async function () {
        const { roleBasedNFT, tokenGatedDAO, owner, user1, DAO_ADMIN_ROLE, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(owner.address);
        await roleBasedNFT.grantRole(DAO_ADMIN_ROLE, 0, owner.address, 0, true, "0x");
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 1, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 1, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await expect(tokenGatedDAO.connect(owner).executeProposal(0))
          .to.be.revertedWith("TokenGatedDAO: Proposal not succeeded");
      });
    });

    describe("Edge Cases for Proposal States", function () {
      it("Should handle getProposal for invalid ID", async function () {
        const { tokenGatedDAO } = await loadFixture(deployTokenGatedDAOFixture);
        
        await expect(tokenGatedDAO.getProposal(999))
          .to.be.revertedWith("TokenGatedDAO: Invalid proposal ID");
      });

      it("Should handle getProposalState for invalid ID", async function () {
        const { tokenGatedDAO } = await loadFixture(deployTokenGatedDAOFixture);
        
        await expect(tokenGatedDAO.getProposalState(999))
          .to.be.revertedWith("TokenGatedDAO: Invalid proposal ID");
      });

      it("Should return Defeated state for proposal without enough quorum", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await time.increase(86401);
        
        await tokenGatedDAO.connect(user1).castVote(0, 1, "Support");
        
        await time.increase(259201);
        
        const state = await tokenGatedDAO.getProposalState(0);
        expect(state).to.equal(3);
      });

      it("Should return Cancelled state for cancelled proposal", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        await tokenGatedDAO.connect(user1).cancelProposal(0);
        
        const state = await tokenGatedDAO.getProposalState(0);
        expect(state).to.equal(2);
      });
    });

    describe("Treasury Management", function () {
      it("Should receive Ether correctly", async function () {
        const { tokenGatedDAO, user1 } = await loadFixture(deployTokenGatedDAOFixture);
        
        const amount = ethers.parseEther("1.0");
        
        await expect(() =>
          user1.sendTransaction({
            to: tokenGatedDAO.getAddress(),
            value: amount
          })
        ).to.changeEtherBalance(tokenGatedDAO, amount);
        
        expect(await tokenGatedDAO.treasury(ethers.ZeroAddress)).to.equal(amount);
      });

      it("Should handle insufficient treasury balance on withdrawal", async function () {
        const { roleBasedNFT, tokenGatedDAO, owner, DAO_ADMIN_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(owner.address);
        await roleBasedNFT.grantRole(DAO_ADMIN_ROLE, 0, owner.address, 0, true, "0x");
        
        await expect(tokenGatedDAO.connect(owner).withdrawFromTreasury(owner.address, ethers.parseEther("1.0")))
          .to.be.revertedWith("TokenGatedDAO: Insufficient treasury balance");
      });
    });

    describe("DAO Configuration Updates", function () {
      it("Should allow admin to update all configuration parameters", async function () {
        const { roleBasedNFT, tokenGatedDAO, owner, DAO_ADMIN_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(owner.address);
        await roleBasedNFT.grantRole(DAO_ADMIN_ROLE, 0, owner.address, 0, true, "0x");
        
        const newVotingDelay = 172800;
        const newVotingPeriod = 604800;
        const newProposalThreshold = 5;
        const newQuorum = 10;
        
        await tokenGatedDAO.connect(owner).updateConfig(
          newVotingDelay,
          newVotingPeriod,
          newProposalThreshold,
          newQuorum
        );
        
        expect(await tokenGatedDAO.votingDelay()).to.equal(newVotingDelay);
        expect(await tokenGatedDAO.votingPeriod()).to.equal(newVotingPeriod);
        expect(await tokenGatedDAO.proposalThreshold()).to.equal(newProposalThreshold);
        expect(await tokenGatedDAO.quorum()).to.equal(newQuorum);
      });
    });

    describe("Voting Edge Cases", function () {
      it("Should not allow voting on cancelled proposal", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        

        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await tokenGatedDAO.connect(user1).cancelProposal(0);
        
        await time.increase(86401);
        
        await expect(tokenGatedDAO.connect(user1).castVote(0, 1, "Support"))
          .to.be.revertedWith("TokenGatedDAO: Proposal cancelled");
      });

      it("Should not allow voting before voting starts", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await expect(tokenGatedDAO.connect(user1).castVote(0, 1, "Support"))
          .to.be.revertedWith("TokenGatedDAO: Voting not started");
      });

      it("Should not allow voting after voting ends", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await time.increase(86401 + 259201);
        
        await expect(tokenGatedDAO.connect(user1).castVote(0, 1, "Support"))
          .to.be.revertedWith("TokenGatedDAO: Voting ended");
      });

      it("Should not allow voting with zero voting power", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, user2, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        
        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await time.increase(86401);
        
        await expect(tokenGatedDAO.connect(user2).castVote(0, 1, "Support"))
          .to.be.revertedWith("TokenGatedDAO: Not authorized to vote");
      });

      it("Should handle voting with user who has voting power but calls with zero power", async function () {
        const { roleBasedNFT, tokenGatedDAO, user1, user2, PROPOSAL_CREATOR_ROLE, VOTER_ROLE } = await loadFixture(deployTokenGatedDAOFixture);
        
        await roleBasedNFT.mint(user1.address);
        await roleBasedNFT.connect(user1).grantRole(PROPOSAL_CREATOR_ROLE, 0, user1.address, 0, true, "0x");
        await roleBasedNFT.connect(user1).grantRole(VOTER_ROLE, 0, user1.address, 0, true, "0x");
        
        await roleBasedNFT.mint(user2.address);
        await roleBasedNFT.connect(user2).grantRole(VOTER_ROLE, 1, user2.address, 0, true, "0x");
        await roleBasedNFT.connect(user2).revokeRole(VOTER_ROLE, 1, user2.address);
        

        await tokenGatedDAO.connect(user1).propose("Test Proposal", "Test description");
        
        await time.increase(86401);
        
        await expect(tokenGatedDAO.connect(user2).castVote(0, 1, "Support"))
          .to.be.revertedWith("TokenGatedDAO: Not authorized to vote");
      });
    });
  });
});

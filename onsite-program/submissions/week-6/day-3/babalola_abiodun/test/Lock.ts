import {time,loadFixture,} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

enum Role{
  DEFAULT, ADMIN, USER
}

describe("Token_DAO", function () {

  async function deployTokenDAO() {
    const [owner, acc1] = await hre.ethers.getSigners();
    const TokenDAO = await hre.ethers.getContractFactory("GovernanceDAO");
    const NFT = await hre.ethers.getContractFactory("GovernanceDAOToken");
    const TokenGateway = await hre.ethers.getContractFactory("TokenGateway");
    const nft = await NFT.connect(owner).deploy();
    const tokenGateway = await TokenGateway.connect(owner).deploy(await nft.getAddress());
    const tokenDAO = await TokenDAO.connect(owner).deploy(await tokenGateway.getAddress());
    return { tokenDAO, owner, acc1, nft };
  }

  describe("account creation", () => { 
    it("tests users joins and get one nft", async () => { 
      const { tokenDAO, acc1 } = await loadFixture(deployTokenDAO);
      await tokenDAO.createUser(acc1.address,Role.USER,"");
      expect(await tokenDAO.isUser.staticCall(acc1.address)).to.true;
    })
    it("tests admin nft can be revoked", async () => { 
      const { tokenDAO, acc1, owner} = await loadFixture(deployTokenDAO);
      await tokenDAO.createUser(acc1.address,Role.ADMIN,"");
      expect(await tokenDAO.isUser.staticCall(acc1.address)).to.true;
      await tokenDAO.connect(owner).revokeRole(acc1.address);
      expect(await tokenDAO.isUser.staticCall(acc1.address)).to.true;
      expect(await tokenDAO.connect(owner).unlockToken(acc1.address)).to.not.reverted
    })
  })
  describe("proposals", () => { 
    it("test only admin can create proposals", async() => { 
      const { tokenDAO, acc1, owner} = await loadFixture(deployTokenDAO);
      await tokenDAO.createUser(acc1.address, Role.ADMIN, "");
      expect(await tokenDAO.connect(owner).createProposal("proposal 101", 1_000_000)).to.be.revertedWithCustomError("User does not exist");
      const proposalId = await tokenDAO.connect(acc1).createProposal.staticCall("proposal 101", 1_000_000);
      const proposal = await tokenDAO.getProposalById.staticCall(proposalId);
      expect(proposal.votedFor).to.equal(0);
      expect(proposal.noVotedFor).to.equal(0);
    })
  })
});

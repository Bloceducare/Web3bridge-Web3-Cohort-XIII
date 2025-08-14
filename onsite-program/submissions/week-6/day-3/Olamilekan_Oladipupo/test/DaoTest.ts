import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import {ethers} from "hardhat";

describe("Dao", function () {
  async function deployDao() {
    const [owner, otherAccount, anotherAccount] = await ethers.getSigners();


    const NftRoles = await ethers.getContractFactory("NftRoles");
    const nftRoles = await NftRoles.deploy();


    const Dao = await ethers.getContractFactory("Dao");
    const dao = await Dao.deploy(nftRoles.target);

    return { dao, owner, otherAccount, anotherAccount };
  }

  describe("Dao contract", function () {
    it("Should create Proposal", async function () {
      const { dao, owner } = await loadFixture(deployDao);
      const _description = "should we increase salary";

      await dao.createProposal(_description);

      const proposal =  await dao.getProposal(0);

      expect(proposal.id).to.equal(0);
      expect(proposal.description).to.equal(_description);
      expect(proposal.createdBy).to.equal(owner.address);
    });
    it("Should vote Proposal", async function () {
      const { dao, owner } = await loadFixture(deployDao);
      const _description = "should we increase salary";

      await dao.createProposal(_description);

      const proposal =  await dao.getProposal(0);

      expect(proposal.id).to.equal(0);
      expect(proposal.description).to.equal(_description);
      expect(proposal.createdBy).to.equal(owner.address);
      expect(proposal.votesFor).to.equal(0);


      await dao.vote(0);

      const votedProposal =  await dao.getProposal(0);
      expect(votedProposal.votesFor).to.equal(1);
    });

    it("Should execute Proposal", async function () {
      const { dao, owner } = await loadFixture(deployDao);
      const _description = "should we increase salary";

      await dao.createProposal(_description);

      const proposal =  await dao.getProposal(0);

      expect(proposal.id).to.equal(0);
      expect(proposal.description).to.equal(_description);
      expect(proposal.createdBy).to.equal(owner.address);
      expect(proposal.votesFor).to.equal(0);


      await dao.vote(0);
      await dao.executeProposal(0);
      const votedProposal =  await dao.getProposal(0);
      expect(votedProposal.votesFor).to.equal(1);
      expect(votedProposal.executed).to.be.true

    });




  });
});

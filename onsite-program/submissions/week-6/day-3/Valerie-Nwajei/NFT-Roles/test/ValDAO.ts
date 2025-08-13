import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("ValDAO", function () {
  async function deployValDAO() {
    
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const ValDAO = await hre.ethers.getContractFactory("ValDAO");
    const dao = await ValDAO.deploy();

    return { dao, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should allow deposits and update voting power", async function () {
    const {dao, addr1} = await loadFixture(deployValDAO);
    await dao.connect(addr1).deposit({ value: hre.ethers.parseEther("0.001") });
    expect(await dao.votingPower(addr1.address)).to.equal(hre.ethers.parseEther("0.001"));
  });


  it("Should allow proposal creation", async function () {
    const {dao, addr1} = await loadFixture(deployValDAO);
    await dao.connect(addr1).deposit({ value: hre.ethers.parseEther("0.001") });
    await dao.connect(addr1).createProposal("Test Proposal");
    const proposal = await dao.proposals(0);
    expect(proposal.description).to.equal("Test Proposal");
  });
});
});

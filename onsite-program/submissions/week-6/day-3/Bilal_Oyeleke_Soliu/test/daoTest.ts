import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ManageDAO", function () {

  async function deployFixture() {
    const [owner, member1, member2] = await hre.ethers.getSigners();

    // Deploy a mock EIP-7432 contract
    const EIP7432Mock = await hre.ethers.getContractFactory("EIP7432Mock");
    const eip7432 = await EIP7432Mock.deploy();

    // Deploy ManageDAO with the mock address
    const ManageDAO = await hre.ethers.getContractFactory("ManageDAO");
    const dao = await ManageDAO.deploy(await eip7432.getAddress());

    return { dao, eip7432, owner, member1, member2 };
  }

  describe("Deployment", function () {
    it("Should deploy with correct EIP7432 address", async function () {
      const { dao, eip7432 } = await loadFixture(deployFixture);
      expect(await dao.getAddress()).to.be.properAddress;
      expect(await eip7432.getAddress()).to.be.properAddress;
    });
  });

  describe("createMember", function () {
    it("Should create a protocol worker and assign role", async function () {
        const { dao, owner, member1 } = await loadFixture(deployFixture);
      
        await dao.connect(owner).createMember(
          "Alice",
          30,
          member1.address,
          Math.floor(Date.now() / 1000) + 360000,
          "extra data",
          0
        );
      
        const member = await dao.getMember(member1.address);
        expect(member.name).to.equal("Alice");
        expect(member.user).to.equal(member1.address);
      });
      
      it("Should revert if member already exists", async function () {
        const { dao, owner, member1 } = await loadFixture(deployFixture);
      
        await dao.connect(owner).createMember(
          "Alice",
          30,
          member1.address,
          Math.floor(Date.now() / 1000) + 3600,
          "extra data",
          0
        );
      
        await expect(
          dao.connect(owner).createMember(
            "Bob",
            25,
            member1.address,
            Math.floor(Date.now() / 1000) + 3600,
            "extra data",
            1
          )
        ).to.be.revertedWithCustomError(dao, "MEMBER_ALREADY_EXISTS");
      });
  });

  describe("Proposal creation", function () {
    it("Should allow worker to create proposal", async function () {
      const { dao, member1 } = await loadFixture(deployFixture);

      await dao.createMember("Alice", 30, member1.address, Math.floor(Date.now() / 1000) + 3600, "extra data", 0);

      await expect(
        dao.connect(member1).createProposal(
          "New Idea",
          "Description of idea",
          hre.ethers.ZeroAddress,
          1
        )
      ).to.emit(dao, "ProposalCreated");
    });

    it("Should revert if member has no permission to create proposals", async function () {
      const { dao, member2 } = await loadFixture(deployFixture);

      await dao.createMember("Charlie", 28, member2.address, Math.floor(Date.now() / 1000) + 3600, "extra data", 1); // protocolContributor

      await expect(
        dao.connect(member2).createProposal(
          "New Idea",
          "Description of idea",
          hre.ethers.ZeroAddress,
          1
        )
      ).to.be.revertedWithCustomError(dao, "PERMISSION_DENIED");
    });
  });
});

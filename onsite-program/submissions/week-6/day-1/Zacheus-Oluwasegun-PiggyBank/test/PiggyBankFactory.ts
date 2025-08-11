import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { expect } from "chai";

describe("PiggyFactory", () => {
  async function deployFixture() {
    const [owner, acct2] = await hre.ethers.getSigners();
    const PiggyFactory = await hre.ethers.getContractFactory(
      "PiggyBankFactory"
    );
    const piggyBankFactory = await PiggyFactory.deploy();

    return { owner, acct2, piggyBankFactory };
  }

  describe("Deployment", () => {
    it("Check owner", async () => {
      const { owner, piggyBankFactory } = await loadFixture(deployFixture);

      expect(await piggyBankFactory.admin()).to.be.equal(owner.address);
    });
  });

  describe("Create Piggy", () => {
    it("saves address", async () => {
      const { acct2, piggyBankFactory } = await loadFixture(deployFixture);

      await piggyBankFactory.connect(acct2).createPiggyBank();
      const addy = await piggyBankFactory.allPiggyBanks(0)

      expect((await piggyBankFactory.getAllPiggyBanks()).length).to.be.equal(1);
      expect(await piggyBankFactory.getUserPiggyBank(acct2)).to.be.equal(addy);
    });

    it("only admin", async () => {
      const { acct2, piggyBankFactory } = await loadFixture(deployFixture);

      await piggyBankFactory.connect(acct2).createPiggyBank();

      expect(piggyBankFactory.connect(acct2).getAllPiggyBanks()).to.be.revertedWith("Only admin can call this")
    });
  });
});

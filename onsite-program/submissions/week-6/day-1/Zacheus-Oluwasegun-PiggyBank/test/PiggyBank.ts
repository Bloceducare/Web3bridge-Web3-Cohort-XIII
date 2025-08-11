import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { expect } from "chai";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

describe("Piggy Bank", () => {
  async function deployFixture() {
    const [owner, acct2] = await hre.ethers.getSigners();
    const PiggyBankFactory = await hre.ethers.getContractFactory(
      "PiggyBankFactory"
    );
    const piggyBankFactory = await PiggyBankFactory.deploy();
    const factory_addy = await piggyBankFactory.getAddress();

    const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
    const piggyBank = await PiggyBank.connect(acct2).deploy(
      acct2,
      factory_addy
    );

    const account_name = "Account One";

    return { owner, acct2, piggyBank, factory_addy, account_name };
  }

  describe("Deployment", () => {
    it("should set owner and admin", async () => {
      const { factory_addy, piggyBank } = await loadFixture(deployFixture);

      expect(await piggyBank.admin()).to.be.equal(factory_addy);
    });
  });

  describe("Functions", () => {
    it("should create account and get account", async () => {
      const { acct2, piggyBank, account_name } = await loadFixture(
        deployFixture
      );

      const lock = await helpers.time.latest();
      expect(
        piggyBank.connect(acct2).createSavingsAccount(account_name, lock - 500)
      ).to.be.revertedWith("Unlock time should be in the future");
      expect(
        piggyBank.createSavingsAccount(account_name, lock - 500)
      ).to.be.revertedWith("You're not the owner");

      const tx = await piggyBank
        .connect(acct2)
        .createSavingsAccount(account_name, lock + 500);
      expect(tx).to.emit(piggyBank, "AccountCreated");
      expect((await piggyBank.getAllAccounts()).length).to.be.greaterThan(0);
      expect(await piggyBank.getUserBalance()).to.be.equal(0);
    });
    it("deposit to account", async () => {
      const { acct2, piggyBank, account_name } = await loadFixture(
        deployFixture
      );

      const lock = await helpers.time.latest();
      await piggyBank
        .connect(acct2)
        .createSavingsAccount(account_name, lock + 500);

      expect(
        piggyBank.connect(acct2).getAccount(4)
      ).to.be.revertedWithCustomError(piggyBank, "ACCOUNT_DOES_NOT_EXIST");
      expect((await piggyBank.connect(acct2).getAccount(1)).isLocked).to.be
        .false;

      await piggyBank
        .connect(acct2)
        .fundAccount(900, 1, hre.ethers.ZeroAddress, {
          value: 900, // or hre.ethers.parseEther("0.000000000000000900") if using wei
        });

      expect(await piggyBank.connect(acct2).getUserBalance()).to.be.equal(900);
    });

    it("withdraw from account", async () => {
      const { acct2, piggyBank, account_name } = await loadFixture(
        deployFixture
      );

      const lock = await helpers.time.latest();
      await piggyBank
        .connect(acct2)
        .createSavingsAccount(account_name, lock + 500);

      await piggyBank
        .connect(acct2)
        .fundAccount(900, 1, hre.ethers.ZeroAddress, {
          value: 900,
        });

      await piggyBank.connect(acct2).withdraw(400, 1, hre.ethers.ZeroAddress)
      expect((await piggyBank.connect(acct2).getAccount(1)).balance).to.be.equal(500);
      expect((await piggyBank.connect(acct2).getAccount(1)).isLocked).to.be.true

      await piggyBank.connect(acct2).withdraw(500, 1, hre.ethers.ZeroAddress)
      expect((await piggyBank.connect(acct2).getAccount(1)).isLocked).to.be.false
    });
  });
});

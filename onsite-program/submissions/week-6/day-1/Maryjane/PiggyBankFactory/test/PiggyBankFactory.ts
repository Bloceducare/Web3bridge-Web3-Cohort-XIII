import { ethers } from "hardhat";
import { expect } from "chai";

describe("PiggyBankFactory", function () {
  it("should create a piggy bank for a user", async function () {
    const [owner, user] = await ethers.getSigners();
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    const factory = await PiggyBankFactory.deploy();
    await factory.waitForDeployment();

    await factory.connect(user).createPiggyBank();
    const piggyBankAddress = await factory.getPiggyBank(user.address);

    expect(piggyBankAddress).to.not.equal(ethers.ZeroAddress);

    const piggyBank = await ethers.getContractAt("PiggyBank", piggyBankAddress);
    expect(await piggyBank.owner()).to.equal(user.address);
    expect(await piggyBank.factory()).to.equal(await factory.getAddress());
  });

  it("should allow creating a savings plan with Ether", async function () {
    const [owner, user] = await ethers.getSigners();
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    const factory = await PiggyBankFactory.deploy();
    await factory.waitForDeployment();

    await factory.connect(user).createPiggyBank();
    const piggyBankAddress = await factory.getPiggyBank(user.address);
    const piggyBank = await ethers.getContractAt("PiggyBank", piggyBankAddress);

    const lockPeriod = 60 * 60 * 24; // 1 day
    await piggyBank
      .connect(user)
      .createSavingsPlan(true, ethers.ZeroAddress, lockPeriod, {
        value: ethers.parseEther("1"),
      });

    expect(await piggyBank.savingsAccountCount()).to.equal(1n); // Fixed: Use 1n
    expect(await piggyBank.getBalance(0)).to.equal(ethers.parseEther("1"));
  });

  it("should apply 3% penalty for early withdrawal", async function () {
    const [owner, user] = await ethers.getSigners();
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    const factory = await PiggyBankFactory.deploy();
    await factory.waitForDeployment();

    await factory.connect(user).createPiggyBank();
    const piggyBankAddress = await factory.getPiggyBank(user.address);
    const piggyBank = await ethers.getContractAt("PiggyBank", piggyBankAddress);

    const lockPeriod = 60 * 60 * 24; // 1 day
    await piggyBank
      .connect(user)
      .createSavingsPlan(true, ethers.ZeroAddress, lockPeriod, {
        value: ethers.parseEther("1"),
      });

    const initialAdminBalance = await ethers.provider.getBalance(owner.address);
    await piggyBank.connect(user).withdraw(0, ethers.parseEther("1"));
    const finalAdminBalance = await ethers.provider.getBalance(owner.address);

    const penalty = (ethers.parseEther("1") * 3n) / 100n; // 3%
    expect(finalAdminBalance - initialAdminBalance).to.equal(penalty);
  });

  it("should allow creating and depositing to an ERC20 savings plan", async function () {
    const [owner, user] = await ethers.getSigners();
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    const factory = await PiggyBankFactory.deploy();
    await factory.waitForDeployment();

   
  });
});
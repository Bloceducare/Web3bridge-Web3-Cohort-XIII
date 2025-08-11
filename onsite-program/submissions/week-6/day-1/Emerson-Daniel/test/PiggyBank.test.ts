import { expect } from "chai";
import { ethers } from "hardhat";

describe("PiggyBankFactory", function () {
  let factory: any;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PiggyBankFactory");
    factory = await Factory.deploy();
  });

  it("Should create a piggy bank with unique lock", async function () {
    await factory.connect(user).createPiggyBank(3600);
    expect(await factory.getPiggyBankCount(user.address)).to.equal(1);

    const banks = await factory.getUserPiggyBanks(user.address);
    expect(banks.length).to.equal(1);

    // Duplicate lock fails
    await expect(factory.connect(user).createPiggyBank(3600)).to.be.revertedWith("Unique lock period required");
  });

  it("Should track total balance (empty initially)", async function () {
    await factory.connect(user).createPiggyBank(3600);
    expect(await factory.getTotalBalance(user.address, ethers.ZeroAddress)).to.equal(0);
  });
});
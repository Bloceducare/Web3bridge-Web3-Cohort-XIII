import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("PiggyBankFactory", function () {
  let PiggyBankFactory: any;
  let piggyBankFactory: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    piggyBankFactory = await PiggyBankFactory.deploy();
    await piggyBankFactory.waitForDeployment();
  });

  it(" Should set the owner to deployer", async function () {
    expect(await piggyBankFactory.owner()).to.equal(owner.address);
  });

  it(" Should create a PiggyBank for the caller", async function () {
    const tx = await piggyBankFactory.connect(addr1).createPiggyBank();
    await tx.wait();
    const stored = await piggyBankFactory.userPiggyBanks(addr1.address, 0);
    expect(stored).to.properAddress;
  });

  it("Should store new PiggyBanks in allPiggyBanks", async function () {
    await piggyBankFactory.createPiggyBank();
    const stored = await piggyBankFactory.allPiggyBanks(0);
    expect(stored).to.properAddress;
  });

  it(" Should allow multiple PiggyBanks for one user", async function () {
    await piggyBankFactory.connect(addr1).createPiggyBank();
    await piggyBankFactory.connect(addr1).createPiggyBank();
    const first = await piggyBankFactory.userPiggyBanks(addr1.address, 0);
    const second = await piggyBankFactory.userPiggyBanks(addr1.address, 1);
    expect(first).to.not.equal(second);
  });

  it(" Should allow different users to have their own PiggyBanks", async function () {
    await piggyBankFactory.connect(addr1).createPiggyBank();
    await piggyBankFactory.connect(addr2).createPiggyBank();
    const user1Piggy = await piggyBankFactory.userPiggyBanks(addr1.address, 0);
    const user2Piggy = await piggyBankFactory.userPiggyBanks(addr2.address, 0);
    expect(user1Piggy).to.not.equal(user2Piggy);
  });

  it(" Should emit event on PiggyBank creation", async function () {
    await expect(piggyBankFactory.createPiggyBank())
      .to.emit(piggyBankFactory, "PiggyBankCreated")
      .withArgs(owner.address, anyValue);
  });

  it(" Should return correct PiggyBank address from allPiggyBanks", async function () {
    await piggyBankFactory.createPiggyBank();
    const addressFromGetter = await piggyBankFactory.allPiggyBanks(0);
    expect(addressFromGetter).to.properAddress;
  });

  it(" Should return correct PiggyBank address from userPiggyBanks", async function () {
    await piggyBankFactory.connect(addr1).createPiggyBank();
    const addressFromGetter = await piggyBankFactory.userPiggyBanks(addr1.address, 0);
    expect(addressFromGetter).to.properAddress;
  });

  it(" Should not share PiggyBank addresses between users", async function () {
    await piggyBankFactory.connect(addr1).createPiggyBank();
    await piggyBankFactory.connect(addr2).createPiggyBank();
    const user1Piggy = await piggyBankFactory.userPiggyBanks(addr1.address, 0);
    const user2Piggy = await piggyBankFactory.userPiggyBanks(addr2.address, 0);
    expect(user1Piggy).to.not.equal(user2Piggy);
  });
});

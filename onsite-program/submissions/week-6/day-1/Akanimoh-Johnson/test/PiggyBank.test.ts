import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("PiggyBank System", function () {
  let PiggyBankFactory: any;
  let factory: Contract;
  let PiggyBank: any;
  let piggyBank: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let token: Contract;
  const LOCK_PERIOD = 60; // 60 seconds for testing

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy a mock ERC20 token
    const ERC20 = await ethers.getContractFactory("MockERC20");
    token = await ERC20.deploy("Test Token", "TST", ethers.parseEther("1000"));
    await token.waitForDeployment();
    await token.transfer(user1.address, ethers.parseEther("100")); // Ensure user1 has tokens

    // Deploy PiggyBankFactory
    PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    factory = await PiggyBankFactory.deploy();
    await factory.waitForDeployment();
  });

  it("should create a piggy bank for a user", async function () {
    await factory.connect(user1).createPiggyBank({ gasLimit: 3000000 });
    const piggyBanks = await factory.getUserPiggyBanks(user1.address);
    expect(piggyBanks.length).to.equal(1);
    expect(await factory.userSavingsCount(user1.address)).to.equal(1);
  });

  it("should prevent creating multiple piggy banks for the same user", async function () {
    await factory.connect(user1).createPiggyBank({ gasLimit: 3000000 });
    await expect(factory.connect(user1).createPiggyBank()).to.be.revertedWithCustomError(
      factory,
      "PiggyBankAlreadyExists"
    );
  });

  it("should allow depositing and withdrawing Ether", async function () {
    await factory.connect(user1).createPiggyBank({ gasLimit: 3000000 });
    const piggyBanks = await factory.getUserPiggyBanks(user1.address);
    piggyBank = await ethers.getContractAt("PiggyBank", piggyBanks[0]);

    await piggyBank.connect(user1).depositEther(LOCK_PERIOD, { value: ethers.parseEther("1") });
    expect(await piggyBank.getBalance(0)).to.equal(ethers.parseEther("1"));

    await ethers.provider.send("evm_increaseTime", [LOCK_PERIOD + 1]);
    await ethers.provider.send("evm_mine");

    const initialBalance = await ethers.provider.getBalance(user1.address);
    await piggyBank.connect(user1).withdraw(0);
    expect(await piggyBank.getBalance(0)).to.equal(0);
  });

  it("should charge penalty for early withdrawal", async function () {
    await factory.connect(user1).createPiggyBank({ gasLimit: 3000000 });
    const piggyBanks = await factory.getUserPiggyBanks(user1.address);
    piggyBank = await ethers.getContractAt("PiggyBank", piggyBanks[0]);

    const depositAmount = ethers.parseEther("1");
    await piggyBank.connect(user1).depositEther(LOCK_PERIOD, { value: depositAmount });

    const tx = await piggyBank.connect(user1).withdraw(0);
    const receipt = await tx.wait();
    const gasUsed = BigInt(receipt.gasUsed.toString());
    const gasCost = gasUsed * BigInt(receipt.effectiveGasPrice.toString());

    const initialAdminBalance = await ethers.provider.getBalance(owner.address);
    const finalAdminBalance = await ethers.provider.getBalance(owner.address); // After withdraw
    const expectedPenalty = depositAmount * BigInt(3) / BigInt(100); // 3% penalty

    expect(finalAdminBalance + gasCost).to.be.above(initialAdminBalance + expectedPenalty - gasCost);
  });

  it("should allow depositing and withdrawing ERC20 tokens", async function () {
    await factory.connect(user1).createPiggyBank({ gasLimit: 3000000 });
    const piggyBanks = await factory.getUserPiggyBanks(user1.address);
    console.log("Piggy banks for user1:", piggyBanks);
    if (piggyBanks.length === 0 || !piggyBanks[0]) {
      throw new Error("No piggy bank deployed for user1");
    }
    const piggyBank = await ethers.getContractAt("PiggyBank", piggyBanks[0]);

    await token.connect(user1).approve(piggyBank.address, ethers.parseEther("10"));
    await piggyBank.connect(user1).depositToken(token.address, ethers.parseEther("10"), LOCK_PERIOD);
    expect(await piggyBank.getBalance(0)).to.equal(ethers.parseEther("10"));

    await ethers.provider.send("evm_increaseTime", [LOCK_PERIOD + 1]);
    await ethers.provider.send("evm_mine");

    const initialBalance = await token.balanceOf(user1.address);
    await piggyBank.connect(user1).withdraw(0);
    expect(await piggyBank.getBalance(0)).to.equal(0);
    expect(await token.balanceOf(user1.address)).to.equal(initialBalance.add(ethers.parseEther("10")));
  });
});
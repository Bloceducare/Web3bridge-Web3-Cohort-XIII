const { expect } = require("chai");
const { ethers } = require("hardhat");

// Use Hardhat's loadFixture for efficient test setup
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PiggyBank", function () {
  async function deployPiggyBankFixture() {
    const [admin, user] = await ethers.getSigners();
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    const piggyBank = await PiggyBank.deploy();
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    // await piggyBank.deployed();
    return { piggyBank, admin, user, zeroAddress };
  }

  it("should create an Ether account", async function () {
    const { piggyBank, user, zeroAddress } = await loadFixture(deployPiggyBankFixture);
    await piggyBank.connect(user).createAccount(
      "My Savings",
      0, // Plan.MONTHLY
      0, // AccountType.ETHER
      zeroAddress
    );
    const accountIds = await piggyBank.connect(user).getUserAccountIds();
    expect(accountIds.length).to.equal(1);
    const account = await piggyBank.getAccount(accountIds[0]);
    expect(account.name).to.equal("My Savings");
    expect(account.owner).to.equal(user.address);
    expect(account.accountType).to.equal(0);
  });

  it("should allow deposit and withdrawal after maturity", async function () {
    const { piggyBank, user, zeroAddress } = await loadFixture(deployPiggyBankFixture);
    await piggyBank.connect(user).createAccount(
      "My Savings",
      0, // Plan.MONTHLY
      0, // AccountType.ETHER
      zeroAddress
    );
    const accountIds = await piggyBank.connect(user).getUserAccountIds();
    const accountId = accountIds[0];
    const depositTx = await piggyBank
      .connect(user)
      .deposit(ethers.parseEther("1"), accountId, {
        value: ethers.parseEther("1"),
      });
    await depositTx.wait();
    // Fast-forward time by 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    const account = await piggyBank.getAccount(accountId);

    // Calculate expected payout (principal + 10% interest)
    const principal = ethers.parseEther("1");
    const interest = principal * 10n / 100n; // 10% interest
    const expectedPayout = principal + interest;

    // Withdraw
    const beforeBalance = await ethers.provider.getBalance(user.address);
    const tx = await piggyBank.connect(user).withdraw(accountId);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    const afterBalance = await ethers.provider.getBalance(user.address);
    const actualReceived = afterBalance - beforeBalance + gasUsed;
    // Allow a small margin for rounding
    expect(actualReceived).to.be.closeTo(expectedPayout, ethers.parseEther("0.0001"));
  });

  it("should allow emergency withdrawal with no interest", async function () {
    const { piggyBank, user, zeroAddress } = await loadFixture(deployPiggyBankFixture);
    await piggyBank.connect(user).createAccount(
      "My Savings",
      0, // Plan.MONTHLY
      0, // AccountType.ETHER
      zeroAddress
    );
    const accountIds = await piggyBank.connect(user).getUserAccountIds();
    const accountId = accountIds[0];
    const depositTx = await piggyBank
      .connect(user)
      .deposit(ethers.parseEther("1"), accountId, {
        value: ethers.parseEther("1"),
      });
    await depositTx.wait();
    // Emergency withdraw
    const beforeBalance = await ethers.provider.getBalance(user.address);
    const tx = await piggyBank.connect(user).emergencyWithdraw(accountId);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    const afterBalance = await ethers.provider.getBalance(user.address);
    // Should receive only principal
    expect(afterBalance).to.be.above(beforeBalance.sub(gasUsed));
  });
});

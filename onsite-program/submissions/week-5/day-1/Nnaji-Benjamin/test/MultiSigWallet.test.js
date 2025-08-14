const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
  let wallet;
  let owners;
  let requiredConfirmations;
  let accounts;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owners = [accounts[0].address, accounts[1].address];
    requiredConfirmations = 2;

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    wallet = await MultiSigWallet.deploy(owners, requiredConfirmations);
    await wallet.waitForDeployment();
  });

  it("should accept ETH deposits", async function () {
    const depositAmount = ethers.parseEther("1");

    const tx = await accounts[2].sendTransaction({
      to: await wallet.getAddress(),
      value: depositAmount,
    });
    await tx.wait();

    const balance = await ethers.provider.getBalance(await wallet.getAddress());
    expect(balance).to.equal(depositAmount);
  });

  it("should allow submitting a transaction", async function () {
    const to = accounts[3].address;
    const value = ethers.parseEther("0.1");
    const data = "0x";

    await expect(wallet.connect(accounts[0]).submitTransaction(to, value, data))
      .to.emit(wallet, "SubmitTransaction");

    const tx = await wallet.transactions(0);
    expect(tx.destination).to.equal(to);
    expect(tx.value).to.equal(value);
    expect(tx.executed).to.be.false;
  });

  it("should allow confirming and revoking a transaction", async function () {
    const to = accounts[3].address;
    const value = ethers.parseEther("0.1");
    const data = "0x";

    await wallet.connect(accounts[0]).submitTransaction(to, value, data);

    await expect(wallet.connect(accounts[1]).confirmTransaction(0))
      .to.emit(wallet, "ConfirmTransaction");

    expect(await wallet.isConfirmed(0, accounts[1].address)).to.be.true;

    await expect(wallet.connect(accounts[1]).revokeConfirmation(0))
      .to.emit(wallet, "RevokeConfirmation");

    expect(await wallet.isConfirmed(0, accounts[1].address)).to.be.false;
  });

  it("should execute transaction when required confirmations are met", async function () {
    const valueToSend = ethers.parseEther("0.2");
    await accounts[2].sendTransaction({
      to: await wallet.getAddress(),
      value: valueToSend,
    });

    const to = accounts[3].address;
    const value = ethers.parseEther("0.1");
    const data = "0x";

    await wallet.connect(accounts[0]).submitTransaction(to, value, data);
    await wallet.connect(accounts[1]).confirmTransaction(0);

    const balanceBefore = await ethers.provider.getBalance(to);

    await expect(wallet.connect(accounts[0]).executeTransaction(0))
      .to.emit(wallet, "ExecuteTransaction");

    const balanceAfter = await ethers.provider.getBalance(to);
    expect(balanceAfter - balanceBefore).to.equal(value);
  });
});

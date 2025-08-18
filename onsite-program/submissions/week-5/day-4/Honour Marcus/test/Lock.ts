import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";
import { hre } from "hardhat"

describe("MultiSigWallet", function () {
  it("should deploy with correct owners and confirmation count", async function () {
    const signers = await ethers.getSigners();
    const [addr1, addr2, addr3] = signers;

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(
      [addr1.address, addr2.address, addr3.address],
      3
    );
    await wallet.waitForDeployment();

    const required = await wallet.numConfirmationsRequired();
    const owners = await wallet.getOwners();

    expect(required).to.equal(3);
    expect(owners).to.include.members([addr1.address, addr2.address, addr3.address]);
  });

  it("should receive ETH and emit Deposit event", async function () {
    const signers = await ethers.getSigners();
    const [addr1, addr2, addr3] = signers;

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(
      [addr1.address, addr2.address, addr3.address],
      3
    );
    await wallet.waitForDeployment();

    const tx = await addr1.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1"),
    });

    await tx.wait();

    const balance = await ethers.provider.getBalance(wallet.target);
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("should allow submit, confirm by 3, and execute transaction", async function () {
    const signers = await ethers.getSigners();
    const [addr1, addr2, addr3, recipient] = signers;

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(
      [addr1.address, addr2.address, addr3.address],
      3
    );
    await wallet.waitForDeployment();

    // To Send funds to the wallet
    await addr1.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1"),
    });

    const tx = await wallet.connect(addr1).submitTransaction(
      recipient.address,
      ethers.parseEther("0.5"),
      "0x"
    );
    await tx.wait();

    const txIndex = 0;

    await wallet.connect(addr1).confirmTransaction(txIndex);
    await wallet.connect(addr2).confirmTransaction(txIndex);
    await wallet.connect(addr3).confirmTransaction(txIndex);

    const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

    const execTx = await wallet.connect(addr1).executeTransaction(txIndex);
    await execTx.wait();

    const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(
      ethers.parseEther("0.5")
    );
  });

  it("should not execute if confirmations are less than 3", async function () {
    const signers = await ethers.getSigners();
    const [addr1, addr2, addr3, recipient] = signers;

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(
      [addr1.address, addr2.address, addr3.address],
      3
    );
    await wallet.waitForDeployment();

    await addr1.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1"),
    });

    const tx = await wallet.connect(addr1).submitTransaction(
      recipient.address,
      ethers.parseEther("0.2"),
      "0x"
    );
    await tx.wait();

    const txIndex = 0;

    await wallet.connect(addr1).confirmTransaction(txIndex);
    await wallet.connect(addr2).confirmTransaction(txIndex);

    await expect(
      wallet.connect(addr1).executeTransaction(txIndex)
    ).to.be.revertedWith("cannot execute tx");
  });
});

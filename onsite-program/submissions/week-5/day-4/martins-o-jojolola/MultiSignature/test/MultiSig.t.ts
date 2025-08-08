// test/SimpleMultiSig.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MultiSig, MultiSigFactory } from "../typechain-types";

describe("Simple MultiSig Tests", () => {

  // Basic setup fixture
  async function setupWallet() {
    const [deployer, alice, bob, charlie, dave, recipient] = await ethers.getSigners();

    // Deploy factory
    const Factory = await ethers.getContractFactory("MultiSigWalletFactory");
    const factory = await Factory.deploy() as MultiSigFactory;

    // Create wallet with 3 owners, need 3 confirmations
    const owners = [alice.address, bob.address, charlie.address];
    const tx = await factory.createSignature(owners, 3);
    const receipt = await tx.wait();

    // Get wallet address from event
    const event = receipt?.events?.find(e => e.event === "WalletCreated");
    const walletAddress = event?.args?.wallet;

    // Connect to wallet
    const Wallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = Wallet.attach(walletAddress) as MultiSig;

    return { factory, wallet, alice, bob, charlie, dave, recipient };
  }

  describe("Basic Wallet Setup", () => {

    it("Should create wallet with correct owners", async () => {
      const { wallet, alice, bob, charlie } = await loadFixture(setupWallet);

      const owners = await wallet.getOwners();
      expect(owners).to.include(alice.address);
      expect(owners).to.include(bob.address);
      expect(owners).to.include(charlie.address);
      expect(owners.length).to.equal(3);
    });

    it("Should require 3 confirmations", async () => {
      const { wallet } = await loadFixture(setupWallet);

      const required = await wallet.numConfirmationsRequired();
      expect(required).to.equal(3);
    });

    it("Should start with zero balance", async () => {
      const { wallet } = await loadFixture(setupWallet);

      const balance = await wallet.getBalance();
      expect(balance).to.equal(0);
    });
  });

  describe("Sending Money to Wallet", () => {

    it("Should accept ETH deposits", async () => {
      const { wallet, alice } = await loadFixture(setupWallet);

      const amount = ethers.parseEther("1");
      await alice.sendTransaction({ to: wallet.getAddress(), value: amount });

      const balance = await wallet.getBalance();
      expect(balance).to.equal(amount);
    });

    it("Should emit deposit event", async () => {
      const { wallet, alice } = await loadFixture(setupWallet);

      const amount = ethers.parseEther("0.5");

      await expect(
        alice.sendTransaction({ to: wallet.getAddress(), value: amount })
      ).to.emit(wallet, "Deposit")
        .withArgs(alice.address, amount, amount);
    });
  });

  describe("Submitting Transactions", () => {

    it("Should let owners submit transactions", async () => {
      const { wallet, alice, recipient } = await loadFixture(setupWallet);

      // Fund wallet first
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });

      const amount = ethers.parseEther("1");
      await wallet.connect(alice).submitTransaction(recipient.address, amount, "0x");

      const txCount = await wallet.getTransactionCount();
      expect(txCount).to.equal(1);
    });

    it("Should not let non-owners submit transactions", async () => {
      const { wallet, dave, recipient } = await loadFixture(setupWallet);

      const amount = ethers.parseEther("1");

      await expect(
        wallet.connect(dave).submitTransaction(recipient.address, amount, "0x")
      ).to.be.revertedWith("MultiSig: not owner");
    });

    it("Should store transaction details correctly", async () => {
      const { wallet, alice, recipient } = await loadFixture(setupWallet);

      // Fund wallet
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });

      const amount = ethers.parseEther("1");
      await wallet.connect(alice).submitTransaction(recipient.address, amount, "0x");

      const tx = await wallet.getTransaction(0);
      expect(tx.to).to.equal(recipient.address);
      expect(tx.value).to.equal(amount);
      expect(tx.executed).to.be.false;
      expect(tx.numConfirmations).to.equal(0);
    });
  });

  describe("Confirming Transactions", () => {

    it("Should let owners confirm transactions", async () => {
      const { wallet, alice, bob, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Confirm
      await wallet.connect(bob).confirmTransaction(0);

      const isConfirmed = await wallet.isConfirmed(0, bob.address);
      expect(isConfirmed).to.be.true;
    });

    it("Should increase confirmation count", async () => {
      const { wallet, alice, bob, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Confirm with two owners
      await wallet.connect(alice).confirmTransaction(0);
      await wallet.connect(bob).confirmTransaction(0);

      const tx = await wallet.getTransaction(0);
      expect(tx.numConfirmations).to.equal(2);
    });

    it("Should not let same owner confirm twice", async () => {
      const { wallet, alice, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // First confirmation
      await wallet.connect(alice).confirmTransaction(0);

      // Second confirmation should fail
      await expect(
        wallet.connect(alice).confirmTransaction(0)
      ).to.be.revertedWith("MultiSig: tx already confirmed");
    });
  });

  describe("Executing Transactions", () => {

    it("Should execute with enough confirmations", async () => {
      const { wallet, alice, bob, charlie, recipient } = await loadFixture(setupWallet);

      const amount = ethers.parseEther("1");

      // Fund wallet
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });

      // Submit transaction
      await wallet.connect(alice).submitTransaction(recipient.address, amount, "0x");

      // Get 3 confirmations
      await wallet.connect(alice).confirmTransaction(0);
      await wallet.connect(bob).confirmTransaction(0);
      await wallet.connect(charlie).confirmTransaction(0);

      // Get balances before execution
      const walletBalanceBefore = await wallet.getBalance();
      const recipientBalanceBefore = await recipient.getBalance();

      // Execute
      await wallet.connect(alice).executeTransaction(0);

      // Check balances after
      const walletBalanceAfter = await wallet.getBalance();
      const recipientBalanceAfter = await recipient.getBalance();

      expect(walletBalanceAfter).to.equal(walletBalanceBefore.sub(amount));
      expect(recipientBalanceAfter).to.equal(recipientBalanceBefore.add(amount));
    });

    it("Should not execute without enough confirmations", async () => {
      const { wallet, alice, bob, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Only 2 confirmations (need 3)
      await wallet.connect(alice).confirmTransaction(0);
      await wallet.connect(bob).confirmTransaction(0);

      await expect(
        wallet.connect(alice).executeTransaction(0)
      ).to.be.revertedWith("MultiSig: cannot execute tx");
    });

    it("Should mark transaction as executed", async () => {
      const { wallet, alice, bob, charlie, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Get confirmations and execute
      await wallet.connect(alice).confirmTransaction(0);
      await wallet.connect(bob).confirmTransaction(0);
      await wallet.connect(charlie).confirmTransaction(0);
      await wallet.connect(alice).executeTransaction(0);

      const tx = await wallet.getTransaction(0);
      expect(tx.executed).to.be.true;
    });

    it("Should not execute already executed transaction", async () => {
      const { wallet, alice, bob, charlie, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Get confirmations and execute
      await wallet.connect(alice).confirmTransaction(0);
      await wallet.connect(bob).confirmTransaction(0);
      await wallet.connect(charlie).confirmTransaction(0);
      await wallet.connect(alice).executeTransaction(0);

      // Try to execute again
      await expect(
        wallet.connect(alice).executeTransaction(0)
      ).to.be.revertedWith("MultiSig: tx already executed");
    });
  });

  describe("Revoking Confirmations", () => {

    it("Should let owners revoke their confirmations", async () => {
      const { wallet, alice, bob, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Confirm then revoke
      await wallet.connect(bob).confirmTransaction(0);
      await wallet.connect(bob).revokeConfirmation(0);

      const isConfirmed = await wallet.isConfirmed(0, bob.address);
      expect(isConfirmed).to.be.false;
    });

    it("Should decrease confirmation count when revoking", async () => {
      const { wallet, alice, bob, charlie, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Get 2 confirmations
      await wallet.connect(alice).confirmTransaction(0);
      await wallet.connect(bob).confirmTransaction(0);

      let tx = await wallet.getTransaction(0);
      expect(tx.numConfirmations).to.equal(2);

      // Revoke one
      await wallet.connect(bob).revokeConfirmation(0);

      tx = await wallet.getTransaction(0);
      expect(tx.numConfirmations).to.equal(1);
    });

    it("Should not revoke unconfirmed transaction", async () => {
      const { wallet, alice, bob, recipient } = await loadFixture(setupWallet);

      // Fund and submit
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Bob never confirmed, so can't revoke
      await expect(
        wallet.connect(bob).revokeConfirmation(0)
      ).to.be.revertedWith("MultiSig: tx not confirmed");
    });
  });

  describe("Factory Tests", () => {

    it("Should create multiple wallets", async () => {
      const { factory, alice, bob } = await loadFixture(setupWallet);

      // Create second wallet
      await factory.connect(alice).createSignature([alice.address, bob.address], 2);

      const totalWallets = await factory.getDeployedSig();
      expect(totalWallets).to.equal(2);
    });

    it("Should track wallets by name", async () => {
      const { factory } = await loadFixture(setupWallet);
    });

    it("Should get wallet info", async () => {
      const { factory, wallet, alice } = await loadFixture(setupWallet);
    });

    it("Should prevent duplicate wallet names", async () => {
      const { factory, alice } = await loadFixture(setupWallet);

      await expect(
        factory.createSignature([alice.address], 1,)
      ).to.be.revertedWith("Factory: name already taken");
    });
  });

  describe("Real World Scenarios", () => {

    it("Should handle multiple pending transactions", async () => {
      const { wallet, alice, bob, charlie, recipient } = await loadFixture(setupWallet);

      // Fund wallet
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("5")
      });

      // Submit 3 transactions
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");
      await wallet.connect(bob).submitTransaction(recipient.address, ethers.parseEther("0.5"), "0x");
      await wallet.connect(charlie).submitTransaction(recipient.address, ethers.parseEther("0.1"), "0x");

      const txCount = await wallet.getTransactionCount();
      expect(txCount).to.equal(3);

      // Confirm all transactions
      for (let i = 0; i < 3; i++) {
        await wallet.connect(alice).confirmTransaction(i);
        await wallet.connect(bob).confirmTransaction(i);
        await wallet.connect(charlie).confirmTransaction(i);
      }

      // Execute all
      for (let i = 0; i < 3; i++) {
        await wallet.connect(alice).executeTransaction(i);
      }

      // Check all are executed
      for (let i = 0; i < 3; i++) {
        const tx = await wallet.getTransaction(i);
        expect(tx.executed).to.be.true;
      }
    });

    it("Should handle partial confirmations across transactions", async () => {
      const { wallet, alice, bob, charlie, recipient } = await loadFixture(setupWallet);

      // Fund wallet
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("3")
      });

      // Submit 2 transactions
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("1"), "0x");

      // Partially confirm first transaction
      await wallet.connect(alice).confirmTransaction(0);
      await wallet.connect(bob).confirmTransaction(0);
      // Still need charlie's confirmation

      // Fully confirm second transaction
      await wallet.connect(alice).confirmTransaction(1);
      await wallet.connect(bob).confirmTransaction(1);
      await wallet.connect(charlie).confirmTransaction(1);

      // Only second transaction should be executable
      await expect(
        wallet.connect(alice).executeTransaction(0)
      ).to.be.revertedWith("MultiSig: cannot execute tx");

      // This should work
      await wallet.connect(alice).executeTransaction(1);

      const tx1 = await wallet.getTransaction(1);
      expect(tx1.executed).to.be.true;
    });

    it("Should handle emergency scenarios with revocations", async () => {
      const { wallet, alice, bob, charlie, recipient } = await loadFixture(setupWallet);

      // Fund wallet
      await alice.sendTransaction({
        to: wallet.getAddress(),
        value: ethers.parseEther("2")
      });

      // Submit potentially malicious transaction
      await wallet.connect(alice).submitTransaction(recipient.address, ethers.parseEther("2"), "0x");

      // Alice and Bob confirm
      await wallet.connect(alice).confirmTransaction(0);
      await wallet.connect(bob).confirmTransaction(0);

      // Charlie realizes this is suspicious and refuses to confirm
      // Alice changes her mind and revokes
      await wallet.connect(alice).revokeConfirmation(0);

      // Now transaction can't be executed
      await expect(
        wallet.connect(bob).executeTransaction(0)
      ).to.be.revertedWith("MultiSig: cannot execute tx");
    });
  });
});
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSigWallet", function () {
  async function deployMultiSigFixture() {
    const [owner1, owner2, owner3, nonOwner, recipient] = await hre.ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const requiredConfirmations = 2;

    const MultiSig = await hre.ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSig.deploy(owners, requiredConfirmations);

    await owner1.sendTransaction({
      to: await wallet.getAddress(),
      value: hre.ethers.parseEther("10"),
    });

    return { wallet, owner1, owner2, owner3, nonOwner, recipient };
  }

  describe("Deployment", function () {
    it("Should set owners and required confirmations correctly", async function () {
      const { wallet, owner1 } = await loadFixture(deployMultiSigFixture);

      const owners = await wallet.getOwners();
      expect(owners).to.include(owner1.address);
      expect(await wallet.requiredConfirmations()).to.equal(2);
    });
  });

  describe("Transaction Submission", function () {
    it("Should allow owner to submit a transaction", async function () {
      const { wallet, recipient } = await loadFixture(deployMultiSigFixture);

      const value = hre.ethers.parseEther("1");
      const data = "0x";

      await expect(wallet.submitTransaction(recipient.address, value, data))
        .to.emit(wallet, "TransactionSubmitted")
        .withArgs(0, recipient.address, value);

      const tx = await wallet.getTransaction(0);
      expect(tx[0]).to.equal(recipient.address);
      expect(tx[1]).to.equal(value);
      expect(tx[3]).to.equal(false);
    });
  });

  describe("Transaction Confirmation & Execution", function () {
    it("Should allow confirmations and execute after enough approvals", async function () {
      const { wallet, owner1, owner2, recipient } = await loadFixture(deployMultiSigFixture);

      const value = hre.ethers.parseEther("1");
      const data = "0x";

      await wallet.submitTransaction(recipient.address, value, data);
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.executeTransaction(0))
        .to.emit(wallet, "TransactionExecuted")
        .withArgs(0);
    });

    it("Should revert execution without enough confirmations", async function () {
      const { wallet, owner1, recipient } = await loadFixture(deployMultiSigFixture);

      await wallet.submitTransaction(recipient.address, hre.ethers.parseEther("1"), "0x");
      await wallet.connect(owner1).confirmTransaction(0);

      await expect(wallet.executeTransaction(0)).to.be.revertedWith("Insufficient confirmations");
    });

    it("Should allow revoking confirmation", async function () {
      const { wallet, owner1, recipient } = await loadFixture(deployMultiSigFixture);

      await wallet.submitTransaction(recipient.address, hre.ethers.parseEther("1"), "0x");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner1).revokeConfirmation(0);

      const tx = await wallet.getTransaction(0);
      expect(tx[4]).to.equal(0);
    });
  });

  describe("Permissions", function () {
    it("Should reject actions from non-owners", async function () {
      const { wallet, nonOwner, recipient } = await loadFixture(deployMultiSigFixture);

      await wallet.submitTransaction(recipient.address, hre.ethers.parseEther("1"), "0x");

      await expect(
        wallet.connect(nonOwner).confirmTransaction(0)
      ).to.be.revertedWith("Not an owner");

      await expect(
        wallet.connect(nonOwner).revokeConfirmation(0)
      ).to.be.revertedWith("Not an owner");

      await expect(
        wallet.connect(nonOwner).executeTransaction(0)
      ).to.be.revertedWith("Not an owner");
    });
  });
});

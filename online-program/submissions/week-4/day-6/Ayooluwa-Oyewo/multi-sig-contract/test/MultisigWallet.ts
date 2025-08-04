import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSigWallet", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultiSigWalletFixture() {
    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
    const [owner, ownerTwo, ownerThree] =
      await hre.ethers.getSigners();
    const owners = [owner.address, ownerTwo.address, ownerThree.address];
    const requiredConfirmations = 3;
        const multiSigWallet = await MultiSigWallet.deploy(
        owners,
        requiredConfirmations
        );


    return { multiSigWallet, owner, ownerTwo, ownerThree, owners, requiredConfirmations };
  }

  describe("Deployment", function () {
    it("Should set the right multiSigWallet contract", async function () {
      const { multiSigWallet, owners, requiredConfirmations, owner, ownerTwo, ownerThree } = await loadFixture(deployMultiSigWalletFixture);
      expect(await multiSigWallet.transactionCount()).to.equal(0);
      expect(await multiSigWallet.requiredConfirmations()).to.equal(requiredConfirmations);
      expect((await multiSigWallet.getOwners()).length).to.deep.equal(owners.length);
      expect(await multiSigWallet.isOwner(owner.address)).to.equal(true);
      expect(await multiSigWallet.isOwner(ownerTwo.address)).to.equal(true);
      expect(await multiSigWallet.isOwner(ownerThree.address)).to.equal(true);
      expect(await multiSigWallet.isOwner(hre.ethers.Wallet.createRandom().address)).to.equal(false);
    });
  });

  describe("Submit transaction Function", function () {
    it("Should submit a transaction", async function () {
      const { multiSigWallet, owner, ownerTwo, ownerThree } = await loadFixture(deployMultiSigWalletFixture);
        const destination = owner.address;

      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");

      const eventDetails = await multiSigWallet.getTransaction(1);
      expect(eventDetails.destination).to.equal(destination);
      expect(eventDetails.value).to.equal(hre.ethers.parseEther("1"));
      expect(eventDetails.data).to.equal("0x");
        expect(eventDetails.confirmationCount).to.equal(0);
    });
    it("Should not allow scheduling the transaction if not owner", async function () {
      const { multiSigWallet, owner, ownerTwo } = await loadFixture(deployMultiSigWalletFixture);
      const destination = owner.address;

      await expect(multiSigWallet.connect(ownerTwo).submitTransaction(destination, hre.ethers.parseEther("1"), "0x"))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_NotOwner")
        .withArgs(ownerTwo.address);
    });
  });
  describe("Confirm Transaction", function () {
    it("Should confirm a transaction", async function () {
      const { multiSigWallet, owner, ownerTwo, ownerThree } = await loadFixture(deployMultiSigWalletFixture);
      const destination = owner.address;

      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
      await multiSigWallet.connect(ownerTwo).confirmTransaction(1);
      await multiSigWallet.connect(ownerThree).confirmTransaction(1);

      const eventDetails = await multiSigWallet.getTransaction(1);
      expect(eventDetails.confirmationCount).to.equal(3);
    });
    it("Should not allow confirming a transaction if not owner", async function () {
      const { multiSigWallet, ownerTwo } = await loadFixture(deployMultiSigWalletFixture);
        const destination = ownerTwo.address;   
      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
      await expect(multiSigWallet.connect(ownerTwo).confirmTransaction(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_NotOwner")
        .withArgs(ownerTwo.address);
    });
    
    it("Should not allow confirming a transaction that does not exist", async function () {
      const { multiSigWallet, owner } = await loadFixture(deployMultiSigWalletFixture);
      await expect(multiSigWallet.connect(owner).confirmTransaction(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_InvalidTransactionIndex")
        .withArgs(1);
    });
    it("Should not allow confirming a transaction that is already confirmed", async function () {
      const { multiSigWallet, owner, ownerTwo } = await loadFixture(deployMultiSigWalletFixture);
      const destination = owner.address;

      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
      await multiSigWallet.connect(ownerTwo).confirmTransaction(1);
      await expect(multiSigWallet.connect(ownerTwo).confirmTransaction(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_TransactionAlreadyConfirmed")
        .withArgs(1, ownerTwo.address);
    });
  });

  describe("Revoke Confirmation", function () {
    it("Should revoke a confirmation", async function () {
      const { multiSigWallet, owner, ownerTwo } = await loadFixture(deployMultiSigWalletFixture);
      const destination = owner.address;

      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
      await multiSigWallet.connect(ownerTwo).confirmTransaction(1);
      await multiSigWallet.connect(ownerTwo).revokeConfirmation(1);
      const eventDetails = await multiSigWallet.getTransaction(1);
      expect(eventDetails.confirmationCount).to.equal(1);
    });
    it("Should not allow revoking confirmation if not owner", async function () {
      const { multiSigWallet, ownerTwo } = await loadFixture(deployMultiSigWalletFixture);
      await expect(multiSigWallet.connect(ownerTwo).revokeConfirmation(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_NotOwner")
        .withArgs(ownerTwo.address);
    });
    it("Should not allow revoking confirmation for a transaction that does not exist", async function () {
      const { multiSigWallet, owner } = await loadFixture(deployMultiSigWalletFixture);
      await expect(multiSigWallet.connect(owner).revokeConfirmation(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_InvalidTransactionIndex")
        .withArgs(1);
    });
    it("Should not allow revoking confirmation for a transaction that is not confirmed by the owner", async function () {
      const { multiSigWallet, owner, ownerTwo } = await loadFixture(deployMultiSigWalletFixture);
      const destination = owner.address;
        await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
        await multiSigWallet.connect(ownerTwo).confirmTransaction(1);
        await expect(multiSigWallet.connect(owner).revokeConfirmation(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_TransactionNotConfirmed")
        .withArgs(1, owner.address);
    });

  });

  describe("Execute Transaction", function () {
    it("Should execute a transaction", async function () {
      const { multiSigWallet, owner, ownerTwo, ownerThree } = await loadFixture(deployMultiSigWalletFixture);
      const destination = owner.address;

      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
      await multiSigWallet.connect(ownerTwo).confirmTransaction(1);
      await multiSigWallet.connect(ownerThree).confirmTransaction(1);

      await expect(multiSigWallet.executeTransaction(1))
        .to.emit(multiSigWallet, "TransactionExecuted")
        .withArgs(1);

      const eventDetails = await multiSigWallet.getTransaction(1);
      expect(eventDetails.executed).to.equal(true);
    });
    it("Should not allow executing a transaction if not enough confirmations", async function () {
      const { multiSigWallet, owner } = await loadFixture(deployMultiSigWalletFixture);
      const destination = owner.address;

      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
      await expect(multiSigWallet.executeTransaction(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_InsufficientConfirmations")
        .withArgs(1, 3);
    });
    it("Should not allow executing a transaction that does not exist", async function () {
      const { multiSigWallet, owner } = await loadFixture(deployMultiSigWalletFixture);
      await expect(multiSigWallet.executeTransaction(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_InvalidTransactionIndex")
        .withArgs(1);
    });
    it("Should not allow executing a transaction that has already been executed", async function () {
      const { multiSigWallet, owner, ownerTwo, ownerThree } = await loadFixture(deployMultiSigWalletFixture);
      const destination = owner.address;

      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
      await multiSigWallet.connect(ownerTwo).confirmTransaction(1);
      await multiSigWallet.connect(ownerThree).confirmTransaction(1);

      await multiSigWallet.executeTransaction(1);

      await expect(multiSigWallet.executeTransaction(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_TransactionAlreadyExecuted")
        .withArgs(1);   
    }
    );
    it("Should not allow executing a transaction if the execution fails", async function () {
      const { multiSigWallet, owner, ownerTwo, ownerThree } = await loadFixture(deployMultiSigWalletFixture);
      const destination = hre.ethers.Wallet.createRandom().address; // Use a random address to ensure failure

      await multiSigWallet.submitTransaction(destination, hre.ethers.parseEther("1"), "0x");
      await multiSigWallet.connect(ownerTwo).confirmTransaction(1);
      await multiSigWallet.connect(ownerThree).confirmTransaction(1);

      await expect(multiSigWallet.executeTransaction(1))
        .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet_TransactionExecutionFailed")
        .withArgs(1);
    });
  });

  describe("Getters", function () {
    it("Should return the correct owners", async function () {
      const { multiSigWallet, owners } = await loadFixture(deployMultiSigWalletFixture);
      const contractOwners = await multiSigWallet.getOwners();
      expect(contractOwners).to.deep.equal(owners);
    });

    it("Should return the correct transaction count", async function () {
      const { multiSigWallet } = await loadFixture(deployMultiSigWalletFixture);
      expect(await multiSigWallet.getTransactionCount()).to.equal(0);
    });

    it("Should return transactions", async function () {
      const { multiSigWallet, owner } = await loadFixture(deployMultiSigWalletFixture);
      await multiSigWallet.submitTransaction(owner.address, hre.ethers.parseEther("1"), "0x");
      const transaction = await multiSigWallet.getTransaction(0);
      expect(transaction.destination).to.equal(owner.address);
      expect(transaction.value).to.equal(hre.ethers.parseEther("1"));
      expect(transaction.data).to.equal("0x");
      expect(transaction.confirmationCount).to.equal(0);
      expect(transaction.executed).to.equal(false);
    });
  });
});

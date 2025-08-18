import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSig, MultiSigFactory } from "../typechain-types";

describe("MultiSigWallet", function () {
  let wallet: MultiSig;
  let owners: string[];
  let confirmationsRequired = 2;
  let nonOwner: any;
  let other: any;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    owners = [signers[0].address, signers[1].address, signers[2].address];
    nonOwner = signers[3];
    other = signers[4];

    const WalletFactory: MultiSigFactory = await ethers.getContractFactory("MultiSig");
    wallet = await WalletFactory.deploy(owners, confirmationsRequired);
    await wallet.waitForDeployment();
  });

  describe("Deployment", () => {
    it("should set owners and required confirmations correctly", async () => {
      for (let i = 0; i < owners.length; i++) {
        expect(await wallet.isOwner(owners[i])).to.equal(true);
      }
      expect(await wallet.numConfirmationsRequired()).to.equal(confirmationsRequired);
    });

    it("should revert if owners array has duplicates", async () => {
      const [s0, s1] = await ethers.getSigners();
      const WalletFactory = await ethers.getContractFactory("MultiSig");
      await expect(
        WalletFactory.deploy([s0.address, s0.address], 2)
      ).to.be.revertedWith("owner not unique");
    });

    it("should revert if confirmationsRequired is 0 or greater than owners", async () => {
      const WalletFactory = await ethers.getContractFactory("MultiSig");
      const [s0, s1] = await ethers.getSigners();
      await expect(WalletFactory.deploy([s0.address], 0)).to.be.revertedWith("invalid number of required confirmations");
      await expect(WalletFactory.deploy([s0.address, s1.address], 3)).to.be.revertedWith("invalid number of required confirmations");
    });
  });

  describe("Submit Transaction", () => {
    it("should allow owner to submit transaction", async () => {
      await expect(wallet.submitTransaction(other.address, 100, "0x"))
        .to.emit(wallet, "SubmitTransaction")
        .withArgs(owners[0], 0, other.address, 100, "0x");
    });

    it("should revert if non-owner submits transaction", async () => {
      await expect(wallet.connect(nonOwner).submitTransaction(other.address, 100, "0x"))
        .to.be.revertedWith("not owner");
    });
  });

  describe("Confirm Transaction", () => {
    beforeEach(async () => {
      await wallet.submitTransaction(other.address, 100, "0x");
    });

    it("should allow owner to confirm transaction", async () => {
      await expect(wallet.connect(await ethers.getSigner(owners[1])).confirmTransaction(0))
        .to.emit(wallet, "ConfirmTransaction")
        .withArgs((await ethers.getSigner(owners[1])).getAddress(), 0);
    });

    it("should revert if non-owner confirms transaction", async () => {
      await expect(wallet.connect(nonOwner).confirmTransaction(0))
        .to.be.revertedWith("not owner");
    });

    it("should revert if transaction index is invalid", async () => {
      await expect(wallet.confirmTransaction(99)).to.be.revertedWith("tx does not exist");
    });

    it("should revert if already confirmed", async () => {
      const owner1 = await ethers.getSigner(owners[1]);
      await wallet.connect(owner1).confirmTransaction(0);
      await expect(wallet.connect(owner1).confirmTransaction(0)).to.be.revertedWith("tx already confirmed");
    });
  });

  describe("Execute Transaction", () => {
    beforeEach(async () => {
      await wallet.submitTransaction(other.address, 0, "0x");
      await wallet.connect(await ethers.getSigner(owners[1])).confirmTransaction(0);
    });

    it("should revert if confirmations are not enough", async () => {
      await expect(wallet.executeTransaction(0)).to.be.revertedWith("cannot execute tx");
    });

    it("should execute after enough confirmations", async () => {
      await wallet.confirmTransaction(0); // second confirmation
      await expect(wallet.executeTransaction(0))
        .to.emit(wallet, "ExecuteTransaction")
        .withArgs(owners[0], 0);
    });

    it("should revert if already executed", async () => {
      await wallet.confirmTransaction(0);
      await wallet.executeTransaction(0);
      await expect(wallet.executeTransaction(0)).to.be.revertedWith("tx already executed");
    });
  });

  describe("Revoke Confirmation", () => {
    beforeEach(async () => {
      await wallet.submitTransaction(other.address, 0, "0x");
      await wallet.confirmTransaction(0);
    });

    it("should allow owner to revoke confirmation", async () => {
      await expect(wallet.revokeConfirmation(0))
        .to.emit(wallet, "RevokeConfirmation")
        .withArgs(owners[0], 0);
    });

    it("should revert if transaction not confirmed", async () => {
      await expect(wallet.connect(await ethers.getSigner(owners[1])).revokeConfirmation(0))
        .to.be.revertedWith("tx not confirmed");
    });

    it("should revert if transaction already executed", async () => {
      await wallet.connect(await ethers.getSigner(owners[1])).confirmTransaction(0);
      await wallet.executeTransaction(0);
      await expect(wallet.revokeConfirmation(0)).to.be.revertedWith("tx already executed");
    });
  });

  describe("Getters", () => {
    it("should return transaction count and details", async () => {
      await wallet.submitTransaction(other.address, 0, "0x");
      const txCount = await wallet.getTransactionCount();
      expect(txCount).to.equal(1);

      const tx = await wallet.getTransaction(0);
      expect(tx.to).to.equal(other.address);
      expect(tx.value).to.equal(0);
      expect(tx.executed).to.equal(false);
    });
  });
});

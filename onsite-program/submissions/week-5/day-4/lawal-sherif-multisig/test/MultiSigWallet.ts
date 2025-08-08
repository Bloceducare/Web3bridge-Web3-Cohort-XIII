import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MultiSigWallet", function () {
  let multiSigWallet: MultiSigWallet;
  let owner1: HardhatEthersSigner;
  let owner2: HardhatEthersSigner;
  let owner3: HardhatEthersSigner;
  let nonOwner: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;

  const REQUIRED_CONFIRMATIONS = 2;

  beforeEach(async function () {
    [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();

    const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWalletFactory.deploy(
      [owner1.address, owner2.address, owner3.address],
      REQUIRED_CONFIRMATIONS
    );
    await multiSigWallet.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owners", async function () {
      expect(await multiSigWallet.owners(0)).to.equal(owner1.address);
      expect(await multiSigWallet.owners(1)).to.equal(owner2.address);
      expect(await multiSigWallet.owners(2)).to.equal(owner3.address);
    });

    it("Should set the correct required confirmations", async function () {
      expect(await multiSigWallet.required()).to.equal(REQUIRED_CONFIRMATIONS);
    });

    it("Should mark addresses as owners", async function () {
      expect(await multiSigWallet.isOwner(owner1.address)).to.be.true;
      expect(await multiSigWallet.isOwner(owner2.address)).to.be.true;
      expect(await multiSigWallet.isOwner(owner3.address)).to.be.true;
      expect(await multiSigWallet.isOwner(nonOwner.address)).to.be.false;
    });

    it("Should revert with invalid constructor parameters", async function () {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
      
      // Empty owners array
      await expect(
        MultiSigWalletFactory.deploy([], 1)
      ).to.be.revertedWith("invalid required number of owners");

      // Required > owners length
      await expect(
        MultiSigWalletFactory.deploy([owner1.address], 2)
      ).to.be.revertedWith("invalid required number of owners");

      // Required = 0
      await expect(
        MultiSigWalletFactory.deploy([owner1.address], 0)
      ).to.be.revertedWith("invalid required number of owners");

      // Duplicate owners
      await expect(
        MultiSigWalletFactory.deploy([owner1.address, owner1.address], 1)
      ).to.be.revertedWith("owner is not unique");

      // Zero address owner
      await expect(
        MultiSigWalletFactory.deploy([ethers.ZeroAddress], 1)
      ).to.be.revertedWith("invalid owner");
    });
  });

  describe("Deposits", function () {
    it("Should receive ETH and emit Deposit event", async function () {
      const depositAmount = ethers.parseEther("1.0");

      await expect(
        owner1.sendTransaction({
          to: multiSigWallet.target,
          value: depositAmount,
        })
      )
        .to.emit(multiSigWallet, "Deposit")
        .withArgs(owner1.address, depositAmount);

      expect(await ethers.provider.getBalance(multiSigWallet.target)).to.equal(
        depositAmount
      );
    });
  });

  describe("Submit Transaction", function () {
    it("Should allow owner to submit transaction", async function () {
      const value = ethers.parseEther("0.1");
      const data = "0x";

      await expect(
        multiSigWallet.connect(owner1).submit(recipient.address, value, data)
      )
        .to.emit(multiSigWallet, "Submit")
        .withArgs(0);

      const tx = await multiSigWallet.transactions(0);
      expect(tx.to).to.equal(recipient.address);
      expect(tx.value).to.equal(value);
      expect(tx.data).to.equal(data);
      expect(tx.executed).to.be.false;
    });

    it("Should revert if non-owner tries to submit", async function () {
      const value = ethers.parseEther("0.1");
      const data = "0x";

      await expect(
        multiSigWallet.connect(nonOwner).submit(recipient.address, value, data)
      ).to.be.revertedWith("not owner");
    });
  });

  describe("Approve Transaction", function () {
    beforeEach(async function () {
      // Submit a transaction first
      const value = ethers.parseEther("0.1");
      const data = "0x";
      await multiSigWallet.connect(owner1).submit(recipient.address, value, data);
    });

    it("Should allow owner to approve transaction", async function () {
      await expect(multiSigWallet.connect(owner1).approve(0))
        .to.emit(multiSigWallet, "Approve")
        .withArgs(owner1.address, 0);

      expect(await multiSigWallet.approved(0, owner1.address)).to.be.true;
    });

    it("Should revert if non-owner tries to approve", async function () {
      await expect(
        multiSigWallet.connect(nonOwner).approve(0)
      ).to.be.revertedWith("not owner");
    });

    it("Should revert if transaction doesn't exist", async function () {
      await expect(
        multiSigWallet.connect(owner1).approve(999)
      ).to.be.revertedWith("tx does not exist");
    });

    it("Should revert if already approved", async function () {
      await multiSigWallet.connect(owner1).approve(0);

      await expect(
        multiSigWallet.connect(owner1).approve(0)
      ).to.be.revertedWith("tx already approved");
    });
  });

  describe("Execute Transaction", function () {
    beforeEach(async function () {
      // Fund the wallet
      await owner1.sendTransaction({
        to: multiSigWallet.target,
        value: ethers.parseEther("1.0"),
      });

      // Submit a transaction
      const value = ethers.parseEther("0.1");
      const data = "0x";
      await multiSigWallet.connect(owner1).submit(recipient.address, value, data);
    });

    it("Should execute transaction when enough approvals", async function () {
      // Get approvals from 2 owners (meets required threshold)
      await multiSigWallet.connect(owner1).approve(0);
      await multiSigWallet.connect(owner2).approve(0);

      const recipientBalanceBefore = await ethers.provider.getBalance(
        recipient.address
      );

      await expect(multiSigWallet.connect(owner3).execute(0))
        .to.emit(multiSigWallet, "Execute")
        .withArgs(0);

      const recipientBalanceAfter = await ethers.provider.getBalance(
        recipient.address
      );
      const tx = await multiSigWallet.transactions(0);

      expect(tx.executed).to.be.true;
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(
        ethers.parseEther("0.1")
      );
    });

    it("Should revert if not enough approvals", async function () {
      // Only 1 approval (need 2)
      await multiSigWallet.connect(owner1).approve(0);

      await expect(
        multiSigWallet.connect(owner2).execute(0)
      ).to.be.revertedWith("approvals < required");
    });

    it("Should revert if transaction doesn't exist", async function () {
      await expect(
        multiSigWallet.connect(owner1).execute(999)
      ).to.be.revertedWith("tx does not exist");
    });

    it("Should revert if already executed", async function () {
      // Approve and execute
      await multiSigWallet.connect(owner1).approve(0);
      await multiSigWallet.connect(owner2).approve(0);
      await multiSigWallet.connect(owner3).execute(0);

      // Try to execute again
      await expect(
        multiSigWallet.connect(owner1).execute(0)
      ).to.be.revertedWith("tx already executed");
    });

    it("Should revert if transaction fails", async function () {
      // Create a transaction that will fail (sending more ETH than available)
      const value = ethers.parseEther("10.0"); // More than wallet balance
      const data = "0x";
      await multiSigWallet.connect(owner1).submit(recipient.address, value, data);

      await multiSigWallet.connect(owner1).approve(1);
      await multiSigWallet.connect(owner2).approve(1);

      await expect(
        multiSigWallet.connect(owner3).execute(1)
      ).to.be.revertedWith("tx failed");
    });
  });

  describe("Revoke Approval", function () {
    beforeEach(async function () {
      // Submit and approve a transaction
      const value = ethers.parseEther("0.1");
      const data = "0x";
      await multiSigWallet.connect(owner1).submit(recipient.address, value, data);
      await multiSigWallet.connect(owner1).approve(0);
    });

    it("Should allow owner to revoke approval", async function () {
      await expect(multiSigWallet.connect(owner1).revoke(0))
        .to.emit(multiSigWallet, "Revoke")
        .withArgs(owner1.address, 0);

      expect(await multiSigWallet.approved(0, owner1.address)).to.be.false;
    });

    it("Should revert if non-owner tries to revoke", async function () {
      await expect(
        multiSigWallet.connect(nonOwner).revoke(0)
      ).to.be.revertedWith("not owner");
    });

    it("Should revert if transaction not approved", async function () {
      await expect(
        multiSigWallet.connect(owner2).revoke(0)
      ).to.be.revertedWith("tx not approved");
    });

    it("Should revert if transaction doesn't exist", async function () {
      await expect(
        multiSigWallet.connect(owner1).revoke(999)
      ).to.be.revertedWith("tx does not exist");
    });

    it("Should revert if transaction already executed", async function () {
      // Get enough approvals and execute
      await multiSigWallet.connect(owner2).approve(0);
      
      // Fund the wallet first
      await owner1.sendTransaction({
        to: multiSigWallet.target,
        value: ethers.parseEther("1.0"),
      });
      
      await multiSigWallet.connect(owner3).execute(0);

      // Try to revoke after execution
      await expect(
        multiSigWallet.connect(owner1).revoke(0)
      ).to.be.revertedWith("tx already executed");
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple transactions", async function () {
      // Fund wallet
      await owner1.sendTransaction({
        to: multiSigWallet.target,
        value: ethers.parseEther("2.0"),
      });

      // Submit multiple transactions
      await multiSigWallet.connect(owner1).submit(
        recipient.address,
        ethers.parseEther("0.5"),
        "0x"
      );
      await multiSigWallet.connect(owner2).submit(
        recipient.address,
        ethers.parseEther("0.3"),
        "0x"
      );

      // Approve both transactions
      await multiSigWallet.connect(owner1).approve(0);
      await multiSigWallet.connect(owner2).approve(0);
      await multiSigWallet.connect(owner1).approve(1);
      await multiSigWallet.connect(owner3).approve(1);

      // Execute both
      await multiSigWallet.connect(owner3).execute(0);
      await multiSigWallet.connect(owner1).execute(1);

      const tx0 = await multiSigWallet.transactions(0);
      const tx1 = await multiSigWallet.transactions(1);

      expect(tx0.executed).to.be.true;
      expect(tx1.executed).to.be.true;
    });

    it("Should handle approval and revoke cycles", async function () {
      const value = ethers.parseEther("0.1");
      await multiSigWallet.connect(owner1).submit(recipient.address, value, "0x");

      // Owner1 approves, then revokes, then approves again
      await multiSigWallet.connect(owner1).approve(0);
      expect(await multiSigWallet.approved(0, owner1.address)).to.be.true;

      await multiSigWallet.connect(owner1).revoke(0);
      expect(await multiSigWallet.approved(0, owner1.address)).to.be.false;

      await multiSigWallet.connect(owner1).approve(0);
      expect(await multiSigWallet.approved(0, owner1.address)).to.be.true;
    });
  });
});
import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Multisig Factory Contract", function () {
  async function deployFactoryContract() {
    const [owner, address2, address3, address4, address5] = await hre.ethers.getSigners();
    const MultisigFactory = await hre.ethers.getContractFactory("MultisigFactory");
    const multisigFactory = await MultisigFactory.deploy();

    return { multisigFactory, owner, address2, address3, address4, address5 };
  }

  async function deployMultisigContract() {
    const [owner, address2, address3, address4, address5] = await hre.ethers.getSigners();
    const Multisig = await hre.ethers.getContractFactory("MultiSig_Contract");

    const owners = [owner.address, address2.address, address3.address];
    const numConfirmationsRequired = 2;
    const multisig = await Multisig.deploy(owners, numConfirmationsRequired);

    return { multisig, owner, address2, address3, address4, address5 };
  }

  describe("Factory Test", function () {
    it("Should check correct cnstructor arguments", async function () {
      const { multisigFactory, owner } = await loadFixture(deployFactoryContract);

      const deployOwner = await multisigFactory.owner();
      const deployCount = await multisigFactory.multisigCount();

      expect(deployOwner).to.equal(owner.address);
      expect(deployCount).to.equal(0);
    });

    it("Should check new contract creator", async function () {
      const { multisigFactory, owner, address2, address3, address4, address5 } = await loadFixture(deployFactoryContract);

      const contractOwner = await multisigFactory.createMultisig([owner.address, address2.address, address3.address], 2);

      expect(contractOwner.from).to.equal(owner.address);
    });
    it("Should check count increase", async function () {
      const { multisigFactory, owner, address2, address3 } = await loadFixture(deployFactoryContract);

      const contractOwner = await multisigFactory.createMultisig([owner.address, address2.address, address3.address], 2);
      const deployCount = await multisigFactory.multisigCount();

      expect(contractOwner.from).to.equal(owner.address);
      expect(deployCount).to.equal(1);
    });
  });

 describe("Should check multisig contract", function () {
  it("Should check current multisig account owners", async function () {
    const { multisig, owner, address2, address3, address4, address5 } = await loadFixture(deployMultisigContract);

    const currentOwners = await multisig.getOwners();
    expect(currentOwners).to.deep.equal([owner.address, address2.address, address3.address]);
  });

  it("Should check if owner is correct", async function () {
    const { multisig, owner, address2, address3 } = await loadFixture(deployMultisigContract);

    const isOwnerCheck = await multisig.isOwner(owner.address);
    expect(isOwnerCheck).to.equal(true);
    
    // Also check other owners
    expect(await multisig.isOwner(address2.address)).to.equal(true);
    expect(await multisig.isOwner(address3.address)).to.equal(true);
  });

  it("Should check contract can receive funds", async function () {
    const { multisig, owner } = await loadFixture(deployMultisigContract);

    // Get initial balance
    const initialBalance = await multisig.getBalance();
    
    // Send ETH to contract
    const depositAmount = hre.ethers.parseEther("1.0");
    await expect(
      owner.sendTransaction({
        to: await multisig.getAddress(), // Use getAddress() for contract address
        value: depositAmount,
      })
    ).to.emit(multisig, "Deposit")
     .withArgs(owner.address, depositAmount, depositAmount);

    // Check final balance
    const finalBalance = await multisig.getBalance();
    expect(finalBalance).to.equal(initialBalance + depositAmount);
  });

  it("Should check deposit function works", async function () {
    const { multisig, owner } = await loadFixture(deployMultisigContract);

    const initialBalance = await multisig.getBalance();
    const depositAmount = hre.ethers.parseEther("0.5");

    await expect(
      multisig.connect(owner).deposit({ value: depositAmount })
    ).to.emit(multisig, "Deposit")
     .withArgs(owner.address, depositAmount, depositAmount);

    const finalBalance = await multisig.getBalance();
    expect(finalBalance).to.equal(initialBalance + depositAmount);
  });

  it("Should allow owners to submit transactions", async function () {
    const { multisig, owner, address4 } = await loadFixture(deployMultisigContract);

    // Fund the multisig first
    await owner.sendTransaction({
      to: await multisig.getAddress(),
      value: hre.ethers.parseEther("2.0")
    });

    const transferAmount = hre.ethers.parseEther("1.0");

    await expect(
      multisig.connect(owner).submitTransaction(
        address4.address,
        transferAmount,
        "0x"
      )
    ).to.emit(multisig, "TransactionCreated")
     .withArgs(owner.address, 0, transferAmount, address4.address);

    // Check transaction was created
    expect(await multisig.getTransactionCount()).to.equal(1);
  });

  it("Should not allow non-owners to submit transactions", async function () {
    const { multisig, address4, address5 } = await loadFixture(deployMultisigContract);

    await expect(
      multisig.connect(address4).submitTransaction(
        address5.address,
        hre.ethers.parseEther("1.0"),
        "0x"
      )
    ).to.be.revertedWith("Not owner");
  });

  it("Should allow owners to confirm transactions", async function () {
    const { multisig, owner, address2, address4 } = await loadFixture(deployMultisigContract);

    // Fund and create transaction
    await owner.sendTransaction({
      to: await multisig.getAddress(),
      value: hre.ethers.parseEther("2.0")
    });

    await multisig.connect(owner).submitTransaction(
      address4.address,
      hre.ethers.parseEther("1.0"),
      "0x"
    );

    // Confirm transaction
    await expect(
      multisig.connect(address2).confirmTransaction(0)
    ).to.emit(multisig, "TransactionConfirmed")
     .withArgs(address2.address, 0);

    // Check confirmation status
    expect(await multisig.isConfirmed(0, address2.address)).to.be.true;
  });

  it("Should execute transaction with enough confirmations", async function () {
    const { multisig, owner, address2, address3, address4 } = await loadFixture(deployMultisigContract);

    // Fund multisig
    await owner.sendTransaction({
      to: await multisig.getAddress(),
      value: hre.ethers.parseEther("3.0")
    });

    const transferAmount = hre.ethers.parseEther("1.0");
    const recipientBalanceBefore = await hre.ethers.provider.getBalance(address4.address);

    // Submit transaction
    await multisig.connect(owner).submitTransaction(
      address4.address,
      transferAmount,
      "0x"
    );

    // First confirmation
    await multisig.connect(address2).confirmTransaction(0);

    // Second confirmation should trigger execution
    await expect(
      multisig.connect(address3).confirmTransaction(0)
    ).to.emit(multisig, "TransactionExecuted");

    // Check transaction was executed
    const tx = await multisig.getTransaction(0);
    expect(tx[3]).to.be.true; // executed = true

    // Check recipient received funds
    const recipientBalanceAfter = await hre.ethers.provider.getBalance(address4.address);
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(transferAmount);
  });

  it("Should allow revoking confirmations", async function () {
    const { multisig, owner, address2, address4 } = await loadFixture(deployMultisigContract);

    // Fund and create transaction
    await owner.sendTransaction({
      to: await multisig.getAddress(),
      value: hre.ethers.parseEther("2.0")
    });

    await multisig.connect(owner).submitTransaction(
      address4.address,
      hre.ethers.parseEther("1.0"),
      "0x"
    );

    // Confirm then revoke
    await multisig.connect(address2).confirmTransaction(0);

    await expect(
      multisig.connect(address2).revokeTransaction(0)
    ).to.emit(multisig, "TransactionRevoked")
     .withArgs(address2.address, 0);

    // Check confirmation was revoked
    expect(await multisig.isConfirmed(0, address2.address)).to.be.false;
  });

  it("Should check numConfirmationsRequired is correct", async function () {
    const { multisig } = await loadFixture(deployMultisigContract);

    const requiredConfirmations = await multisig.numConfirmationsRequired();
    expect(requiredConfirmations).to.equal(2); // Based on your deployment
  });

  it("Should return correct transaction details", async function () {
    const { multisig, owner, address4 } = await loadFixture(deployMultisigContract);

    // Fund and create transaction
    await owner.sendTransaction({
      to: await multisig.getAddress(),
      value: hre.ethers.parseEther("2.0")
    });

    const transferAmount = hre.ethers.parseEther("1.0");
    await multisig.connect(owner).submitTransaction(
      address4.address,
      transferAmount,
      "0x"
    );

    const tx = await multisig.getTransaction(0);
    expect(tx[0]).to.equal(address4.address); // to
    expect(tx[1]).to.equal(transferAmount);   // value
    expect(tx[2]).to.equal("0x");             // data
    expect(tx[3]).to.be.false;               // executed
    expect(tx[4]).to.equal(0);               // numConfirmations
  });
});
});

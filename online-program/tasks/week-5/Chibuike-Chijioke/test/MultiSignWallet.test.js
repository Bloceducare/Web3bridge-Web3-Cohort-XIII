const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MultiSignWallet", function () {
  async function deployMultiSigWalletFixture() {
    const [owner, nonOwner, recipient] = await ethers.getSigners();

    const MultiSignWallet = await ethers.getContractFactory("MultiSignWallet");

    const owners = [owner.address];
    const requiredApprovals = 1;

    const multiSig = await MultiSignWallet.deploy(owners, requiredApprovals);
    await multiSig.waitForDeployment();

    return { multiSig, owner, nonOwner, recipient };
  }

  it("Should deploy and set the correct owner", async function () {
    const { multiSig, owner } = await loadFixture(deployMultiSigWalletFixture);
    const owners = await multiSig.getWalletOwners();
    expect(owners).to.include(owner.address);
  });

  it("Should allow owner to submit a transaction", async function () {
    const { multiSig, recipient } = await loadFixture(
      deployMultiSigWalletFixture
    );

    await multiSig.proposeTransaction(recipient.address, 0, "0x");

    const txDetails = await multiSig.viewTransaction(0);

    expect(txDetails.destination).to.equal(recipient.address);
    expect(txDetails.isExecuted).to.equal(false);
  });

  it("Should allow owner to confirm a transaction", async function () {
    const { multiSig, owner, recipient } = await loadFixture(
      deployMultiSigWalletFixture
    );

    await multiSig.proposeTransaction(recipient.address, 0, "0x");

    const tx = await multiSig.approveTransaction(0);

    await expect(tx)
      .to.emit(multiSig, "TransactionConfirmed")
      .withArgs(0, owner.address);
  });

  it("Should allow execution after enough confirmations", async function () {
    const { multiSig, recipient } = await loadFixture(
      deployMultiSigWalletFixture
    );

    await multiSig.proposeTransaction(recipient.address, 0, "0x");
    await multiSig.approveTransaction(0);

    await expect(multiSig.finalizeTransaction(0))
      .to.emit(multiSig, "TransactionExecuted")
      .withArgs(0);
  });

  it("Should revert if non-owner tries to approve", async function () {
    const { multiSig, nonOwner, recipient } = await loadFixture(
      deployMultiSigWalletFixture
    );

    await multiSig.proposeTransaction(recipient.address, 0, "0x");

    await expect(
      multiSig.connect(nonOwner).approveTransaction(0)
    ).to.be.revertedWith("Access denied: Not a wallet owner");
  });
});

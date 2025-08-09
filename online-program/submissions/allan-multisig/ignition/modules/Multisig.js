const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
  let MultiSigWallet, wallet;
  let owner1, owner2, owner3, nonOwner;
  const requiredConfirmations = 2;

  beforeEach(async function () {
    [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];

    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    wallet = await MultiSigWallet.deploy(owners, requiredConfirmations);
    await wallet.waitForDeployment();

    // Send ETH to the wallet
    await owner1.sendTransaction({
      to: await wallet.getAddress(),
      value: ethers.parseEther("10"),
    });
  });

  it("Should deploy with correct owners and required confirmations", async function () {
    expect(await wallet.getOwners()).to.include(owner1.address);
    expect(await wallet.getOwners()).to.include(owner2.address);
    expect(await wallet.getOwners()).to.include(owner3.address);
    expect(await wallet.required()).to.equal(requiredConfirmations);
  });

  it("Should allow submitting a transaction", async function () {
    const to = recipient.address;
    const value = ethers.parseEther("1");
    const data = "0x";

    await expect(wallet.submitTransaction(to, value, data))
      .to.emit(wallet, "TransactionSubmitted")
      .withArgs(0, to, value);

    const tx = await wallet.getTransaction(0);
    expect(tx.to).to.equal(to);
    expect(tx.value).to.equal(value);
    expect(tx.executed).to.equal(false);
  });

  it("Should allow owners to confirm and execute a transaction", async function () {
    const to = recipient.address;
    const value = ethers.parseEther("1");
    const data = "0x";

    await wallet.submitTransaction(to, value, data);
    await wallet.connect(owner1).confirmTransaction(0);
    await wallet.connect(owner2).confirmTransaction(0);

    await expect(wallet.executeTransaction(0))
      .to.emit(wallet, "TransactionExecuted")
      .withArgs(0);
  });

  it("Should revert if non-owner tries to confirm", async function () {
    const to = recipient.address;
    const value = ethers.parseEther("1");
    const data = "0x";

    await wallet.submitTransaction(to, value, data);

    await expect(
      wallet.connect(nonOwner).confirmTransaction(0)
    ).to.be.revertedWithCustomError(wallet, "NotOwner");
  });

  it("Should allow owner to revoke confirmation", async function () {
    const to = recipient.address;
    const value = ethers.parseEther("1");
    const data = "0x";

    await wallet.submitTransaction(to, value, data);
    await wallet.connect(owner1).confirmTransaction(0);
    await wallet.connect(owner1).revokeConfirmation(0);

    const tx = await wallet.getTransaction(0);
    expect(tx.numConfirmations).to.equal(0);
  });

  it("Should revert executing if not enough confirmations", async function () {
    const to = recipient.address;
    const value = ethers.parseEther("1");
    const data = "0x";

    await wallet.submitTransaction(to, value, data);
    await wallet.connect(owner1).confirmTransaction(0);

    await expect(
      wallet.executeTransaction(0)
    ).to.be.revertedWithCustomError(wallet, "NotEnoughConfirmations");
  });
});

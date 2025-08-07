import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import {ethers} from "hardhat";

describe("MultiSigWallet", function () {
  async function deployFixture() {
    const [owner1, owner2, owner3, owner4, recipient] = await ethers.getSigners();
    const MultiSig = await ethers.getContractFactory("MultiSigWallet");

    const owners = [owner1.address, owner2.address, owner3.address];
    const multiSig = await MultiSig.deploy(owners);
    await multiSig.waitForDeployment();

    return { multiSig, owner1, owner2, owner3, owner4, recipient };
  }

  it("Deploys correctly and stores owners", async () => {
    const { multiSig, owner1, owner2, owner3 } = await deployFixture();
    const owners = await multiSig.getOwners();

    expect(owners).to.include.members([owner1.address, owner2.address, owner3.address]);
    expect(owners.length).to.equal(3);
  });

  it("Allows only owners to submit transactions", async () => {
    const { multiSig, owner1, owner4 } = await deployFixture();

    await expect(
      multiSig.connect(owner1).submitTransaction(owner1.address, ethers.parseEther("1"))
    ).to.not.be.reverted;

    await expect(
      multiSig.connect(owner4).submitTransaction(owner1.address, ethers.parseEther("1"))
    ).to.be.revertedWith("Not an owner");
  });

  it("Allows approval from different owners", async () => {
    const { multiSig, owner1, owner2, owner3, recipient } = await deployFixture();

    // Fund the contract
    await owner1.sendTransaction({
      to: await multiSig.getAddress(),
      value: ethers.parseEther("3"),
    });

    // Submit a transaction
    await multiSig.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("2"));

    // Approvals
    await expect(multiSig.connect(owner1).approveTransaction(0)).to.not.be.reverted;
    await expect(multiSig.connect(owner2).approveTransaction(0)).to.not.be.reverted;
    await expect(multiSig.connect(owner3).approveTransaction(0)).to.not.be.reverted;
  });

  it("Executes transaction after 3 approvals", async () => {
    const { multiSig, owner1, owner2, owner3, recipient } = await deployFixture();

    // Fund MultiSig contract
    await owner1.sendTransaction({
      to: await multiSig.getAddress(),
      value: ethers.parseEther("5"),
    });

    const initialBalance = await ethers.provider.getBalance(recipient.address);

    // Submit transaction
    await multiSig.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("1"));

    // Approvals
    await multiSig.connect(owner1).approveTransaction(0);
    await multiSig.connect(owner2).approveTransaction(0);
    await multiSig.connect(owner3).approveTransaction(0); // This should execute

    const finalBalance = await ethers.provider.getBalance(recipient.address);
    expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
  });

  it("Fails to approve twice by same owner", async () => {
    const { multiSig, owner1, owner2, recipient } = await deployFixture();

    await owner1.sendTransaction({
      to: await multiSig.getAddress(),
      value: ethers.parseEther("3"),
    });

    await multiSig.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("1"));

    await multiSig.connect(owner1).approveTransaction(0);
    await expect(multiSig.connect(owner1).approveTransaction(0)).to.be.revertedWith("Already approved");
  });

  it("Prevents execution with insufficient approvals", async () => {
    const { multiSig, owner1, owner2, recipient } = await deployFixture();

    await owner1.sendTransaction({
      to: await multiSig.getAddress(),
      value: ethers.parseEther("3"),
    });

    await multiSig.connect(owner1).submitTransaction(recipient.address, ethers.parseEther("1"));
    await multiSig.connect(owner1).approveTransaction(0);
    await multiSig.connect(owner2).approveTransaction(0);

    const txn = await multiSig.getTransaction(0);
    expect(txn.executed).to.equal(false);
  });
});
const { expect } = require("chai");
const hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SimpleMultisig", function () {
  
  async function deployMultisigFixture() {
  const [owner, signer1, signer2, signer3, recipient] = await hre.ethers.getSigners();

  const SimpleMultisigFactory = await hre.ethers.getContractFactory("SimpleMultisigFactory");
  const factory = await SimpleMultisigFactory.deploy(); // Already deployed

  const tx = await factory.createMultisig(signer1.address, signer2.address, signer3.address);
  const receipt = await tx.wait();

  let multisigAddress;
  try {
    multisigAddress = receipt.events.find((e: any) => e.event === "MultisigCreated").args.multisigAddress;
  } catch {
    const filter = factory.filters.MultisigCreated();
    const events = await factory.queryFilter(filter, receipt.blockNumber);
    multisigAddress = events[0].args.multisigAddress;
  }

  const multisig = await hre.ethers.getContractAt("SimpleMultisig", multisigAddress);

  return { factory, multisig, owner, signer1, signer2, signer3, recipient };
}


  describe("Deployment", function () {
    it("Should create multisig with correct signers", async function () {
      const { multisig, signer1, signer2, signer3 } = await loadFixture(deployMultisigFixture);
      
      expect(await multisig.signer1()).to.equal(signer1.address);
      expect(await multisig.signer2()).to.equal(signer2.address);
      expect(await multisig.signer3()).to.equal(signer3.address);
    });

    it("Should receive and track Ether", async function () {
      const { multisig, signer1 } = await loadFixture(deployMultisigFixture);
      
      await signer1.sendTransaction({ 
        to: multisig.address, 
        value: hre.ethers.parseEther("1")
      });
      const balance = await multisig.getBalance();
      expect(balance).to.equal(hre.ethers.parseEther("1"));
    });
  });

  describe("Transaction Flow", function () {
    it("Should complete full transaction flow", async function () {
      const { multisig, signer1, signer2, signer3, recipient } = await loadFixture(deployMultisigFixture);
      
      await signer1.sendTransaction({ 
        to: multisig.address, 
        value: hre.ethers.parseEther("2") 
      });
      
      await multisig.connect(signer1).proposeTransaction(recipient.address, hre.ethers.parseEther("1"));
      await multisig.connect(signer1).approveTransaction(0);
      await multisig.connect(signer2).approveTransaction(0);
      await multisig.connect(signer3).approveTransaction(0);
      
      const initialBalance = await hre.ethers.provider.getBalance(recipient.address);
      await multisig.executeTransaction(0);
      const finalBalance = await hre.ethers.provider.getBalance(recipient.address);

      const diff = finalBalance - initialBalance;
      expect(diff).to.equal(hre.ethers.parseEther("1"));
    });

    it("Should reject execution without all approvals", async function () {
      const { multisig, signer1, signer2, recipient } = await loadFixture(deployMultisigFixture);
      
      await signer1.sendTransaction({ 
        to: multisig.address, 
        value: hre.ethers.parseEther("1") 
      });
      await multisig.connect(signer1).proposeTransaction(recipient.address, hre.ethers.parseEther("1"));
      await multisig.connect(signer1).approveTransaction(0);
      await multisig.connect(signer2).approveTransaction(0);
      
      await expect(multisig.executeTransaction(0))
        .to.be.revertedWith("Need all 3 approvals");
    });
  });
});

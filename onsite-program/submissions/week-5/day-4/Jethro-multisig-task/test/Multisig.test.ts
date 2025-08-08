const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");

describe("Multisig Contract", function () {
  async function deployMultisig() {
    const [owner1, owner2, owner3, owner4, nonOwner] = await hre.ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address, owner4.address];

    const Multisig = await hre.ethers.getContractFactory("MultiSig");
    const multisig = await Multisig.deploy(owners);

    return { multisig, owner1, owner2, owner3, owner4, nonOwner, owners };
  }

  describe("Deployment", function () {
    it("Should deploy the contract correctly", async function () {
      const { multisig } = await loadFixture(deployMultisig);
      expect(multisig.address).to.not.equal(hre.ethers.ZeroAddress);
    });

    it("Should fail with fewer than 3 owners", async function () {
      const [owner1, owner2] = await hre.ethers.getSigners();
      const Multisig = await hre.ethers.getContractFactory("Multisig");
      await expect(Multisig.deploy([owner1.address, owner2.address]))
        .to.be.revertedWith("At least 3 owners required");
    });
  });

  describe("Main Functions", function () {
    it("Should submit a new transaction", async function () {
      const { multisig, owner1 } = await loadFixture(deployMultisig);
      const to = owner1.address;
      const value = hre.ethers.parseEther("1.0");

      await expect(multisig.submitTransaction(to, value))
        .to.emit(multisig, "TransactionCreated")
        .withArgs(0, to, value);

      const transaction = await multisig.getTransaction(0);
      expect(transaction[0]).to.equal(to); 
      expect(transaction[1]).to.equal(value); 
      expect(transaction[2]).to.equal(false); 
      expect(transaction[3]).to.equal(0); 
    });

    it("Should sign a transaction", async function () {
      const { multisig, owner1, owner2 } = await loadFixture(deployMultisig);
      const to = owner1.address;
      const value = hre.ethers.parseEther("1.0");

      await multisig.connect(owner1).submitTransaction(to, value);
      await multisig.connect(owner2).signTransaction(0);

      const transaction = await multisig.getTransaction(0);
      expect(transaction[3]).to.equal(1); 
      expect(transaction[2]).to.equal(false); 
    });

    it("Should execute transaction after 3 signatures", async function () {
      const { multisig, owner1, owner2, owner3, owner4 } = await loadFixture(deployMultisig);
      const to = owner4.address;
      const value = hre.ethers.parseEther("1.0");
      await owner1.sendTransaction({ to: multisig.address, value });

      await multisig.connect(owner1).submitTransaction(to, value);
      await multisig.connect(owner1).signTransaction(0);
      await multisig.connect(owner2).signTransaction(0);
      
      const initialBalance = await hre.ethers.provider.getBalance(to);
      await expect(multisig.connect(owner3).signTransaction(0))
        .to.emit(multisig, "TransactionExecuted")
        .withArgs(0, owner3.address);

      const transaction = await multisig.getTransaction(0);
      expect(transaction[2]).to.equal(true); 
      expect(transaction[3]).to.equal(3);
      expect(await hre.ethers.provider.getBalance(to)).to.equal(initialBalance + value);
    });

    it("Should fail if non-owner submits or signs", async function () {
      const { multisig, nonOwner, owner1 } = await loadFixture(deployMultisig);
      const to = owner1.address;
      const value = hre.ethers.parseEther("1.0");

      await expect(multisig.connect(nonOwner).submitTransaction(to, value))
        .to.be.revertedWith("Not an owner");
      
      await multisig.connect(owner1).submitTransaction(to, value);
      await expect(multisig.connect(nonOwner).signTransaction(0))
        .to.be.revertedWith("Not an owner");
    });

    it("Should fail with invalid transaction ID", async function () {
      const { multisig } = await loadFixture(deployMultisig);
      await expect(multisig.getTransaction(0))
        .to.be.revertedWith("Invalid transaction ID");
    });
  });
});
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Multisig", () => {
  async function deployMultisig() {
    const [owner1, owner2, owner3, nonOwner] = await ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const requiredSignatures = 2;

    const Multisig = await ethers.getContractFactory("Multisig");
    const deployedContract = await Multisig.deploy(owners, requiredSignatures);

    return { deployedContract, owner1, owner2, owner3, nonOwner, owners, requiredSignatures };
  }

  describe("Deployment", () => {
    it("Should set owners and required signatures correctly", async () => {
      const { deployedContract, owners, requiredSignatures } = await loadFixture(deployMultisig);
      expect(await deployedContract.getOwners()).to.deep.equal(owners);
      expect(await deployedContract.getRequiredSignatures()).to.equal(requiredSignatures);
    });
  });

  describe("Submit Transaction", () => {
    it("Should allow an owner to submit a transaction", async () => {
      const { deployedContract, owner1, nonOwner } = await loadFixture(deployMultisig);
      const txData = "0x";

      await expect(deployedContract.connect(owner1).submitTransaction(nonOwner.address, 0, txData))
        .to.emit(deployedContract, "TransactionCreated");
    });

    it("Should revert if a non-owner tries to submit", async () => {
      const { deployedContract, nonOwner, owner1 } = await loadFixture(deployMultisig);
      await expect(
        deployedContract.connect(nonOwner).submitTransaction(owner1.address, 0, "0x")
      ).to.be.revertedWith("Not an owner!");
    });
  });

  describe("Sign & Execute Transaction", () => {
    it("Should execute after required signatures are collected", async () => {
      const { deployedContract, owner1, owner2, nonOwner } = await loadFixture(deployMultisig);
      await deployedContract.connect(owner1).submitTransaction(nonOwner.address, 0, "0x");

      await deployedContract.connect(owner1).signTransaction(0);
      await expect(deployedContract.connect(owner2).signTransaction(0))
        .to.emit(deployedContract, "TransactionExecuted");
    });

    it("Should revert if non-owner tries to sign", async () => {
      const { deployedContract, owner1, nonOwner } = await loadFixture(deployMultisig);
      await deployedContract.connect(owner1).submitTransaction(nonOwner.address, 0, "0x");

      await expect(deployedContract.connect(nonOwner).signTransaction(0))
        .to.be.revertedWith("Only owners can sign transactions");
    });
  });
});

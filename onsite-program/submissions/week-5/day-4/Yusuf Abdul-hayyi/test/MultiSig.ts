import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSig Wallet", function () {
  async function deployMultiSigFixture() {
    const [owner, addr1, addr2, addr3, recipient] = await hre.ethers.getSigners();

    console.log("Signer 1 address:", owner.address);
    console.log("Signer 2 address:", addr1.address);
    console.log("Signer 3 address:", addr2.address);
    console.log("Signer 4 address:", addr3.address);


    const owners = [owner.address, addr1.address, addr2.address, addr3.address];
    const requiredSignatures = 3;

    const MultiSig = await hre.ethers.getContractFactory("MultiSig");
    const multiSig = await MultiSig.deploy(owners, requiredSignatures, {value: hre.ethers.parseEther("5"),});

    return { multiSig, owner, addr1, addr2, addr3, recipient, owners, requiredSignatures };
  }

  describe("Deployment", function () {
    it("Should set owners and required signatures", async function () {
      const { multiSig, owners, requiredSignatures } = await loadFixture(deployMultiSigFixture);

      for (let i = 0; i < owners.length; i++) {
        expect(await multiSig.owners(i)).to.equal(owners[i]);
      }

      expect(await multiSig.requiredSignatures()).to.equal(requiredSignatures);
    });

    it("Should receive initial funds", async function () {
      const { multiSig } = await loadFixture(deployMultiSigFixture);

      expect(await hre.ethers.provider.getBalance(multiSig.target)).to.equal(
        hre.ethers.parseEther("5")
      );
    });
  });

  describe("Transactions", function () {
    it("Should allow owners to submit and sign transactions", async function () {
      const { multiSig, owner, addr1, recipient } = await loadFixture(deployMultiSigFixture);

      // Submit transaction
      await multiSig.connect(owner).submitTransaction(
        recipient.address,
        hre.ethers.parseEther("1"),
        "0x"
      );

      // Sign transaction by another owner
      await multiSig.connect(addr1).signTransaction(0);

      const sigCount = await multiSig.countSignatures(0);
      expect(sigCount).to.equal(2); // owner + addr1
    });

    it("Should only execute after required signatures are met", async function () {
      const { multiSig, owner, addr1, recipient } = await loadFixture(deployMultiSigFixture);

      const initialBalance = await hre.ethers.provider.getBalance(recipient.address);

      // Submit transaction
      await multiSig.connect(owner).submitTransaction(
        recipient.address,
        hre.ethers.parseEther("1"),
        "0x"
      );

      // Try executing before enough signatures (should fail)
      await expect(multiSig.connect(owner).executeTransaction(0)).to.be.revertedWith(
        "Not enough signatures"
      );

      // Add another signature
      await multiSig.connect(addr1).signTransaction(0);

      // Execute transaction after threshold
      await multiSig.connect(owner).executeTransaction(0);

      const finalBalance = await hre.ethers.provider.getBalance(recipient.address);
      expect(finalBalance - initialBalance).to.equal(hre.ethers.parseEther("1"));
    });
  });
});

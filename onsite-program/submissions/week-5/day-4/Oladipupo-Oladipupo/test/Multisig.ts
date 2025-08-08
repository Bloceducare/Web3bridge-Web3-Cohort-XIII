import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSig", function () {
  async function deployMultiSig() {
    const [signer1, signer2, signer3, nonSigner] = await hre.ethers.getSigners();

    const MultiSig = await hre.ethers.getContractFactory("MultiSig");

    const multiSig = await MultiSig.deploy([signer1.address, signer2.address, signer3.address],2);
      
    await signer1.sendTransaction({
      to: multiSig.target,
      value: hre.ethers.parseEther("9"),
    });
    return { multiSig, signer1, signer2, signer3, nonSigner };
  }

  describe("Deployment", function () {
    it("should set the correct number of required signers", async function () {
      const { multiSig } = await loadFixture(deployMultiSig);      
      const required = await multiSig.getOfRequiredSigners();
      expect(required).to.equal(2n);
    });

    it("should return the correct signers addresses", async function () {
      const { multiSig, signer1, signer2, signer3 } = await loadFixture(deployMultiSig);
      const signers = await multiSig.getSignersAddresses();
      expect(signers).to.deep.equal([signer1.address, signer2.address, signer3.address]);
    });
  });

  describe("Transaction Proposal", function () {
    it("should revert if non-signer tries to propose", async function () {
      const { multiSig, nonSigner, signer2 } = await loadFixture(deployMultiSig);
      await expect(
        multiSig.connect(nonSigner).proposeTransaction(signer2.address, 1000)
      ).to.be.revertedWithCustomError(multiSig, "NOT_OWNER");
    });
  });

  describe("Signing Transactions", function () {
    it("should revert if signer signs twice", async function () {
      const { multiSig, signer1, signer2, signer3 } = await loadFixture(deployMultiSig);
      await multiSig.connect(signer1).proposeTransaction(signer3.address, 1000);

      await expect(
        multiSig.signTransaction(0)
      ).to.be.revertedWithCustomError(multiSig, "TRANSACTION_ALREADY_SIGNED");
    });

    it("should revert if non-signer tries to sign", async function () {
      const { multiSig, signer1, nonSigner, signer3 } = await loadFixture(deployMultiSig);
      await multiSig.connect(signer1).proposeTransaction(signer3.address, 1000);

      await expect(
        multiSig.connect(nonSigner).signTransaction(0)
      ).to.be.revertedWithCustomError(multiSig, "NOT_OWNER");
    });
  });

  describe("Execution", function () {
    it("should execute transaction when required signatures reached", async function () {
      const { multiSig, signer1, signer2, signer3 } = await loadFixture(deployMultiSig);

      await signer1.sendTransaction({
        to: multiSig.target,
        value: hre.ethers.parseEther("1.0"),
      });

      await multiSig.connect(signer1).proposeTransaction(signer3.address, hre.ethers.parseEther("0.5"));
    //   await multiSig.connect(signer2).signTransaction(0);

      const balanceBefore = await hre.ethers.provider.getBalance(signer3.address);
      await multiSig.connect(signer3).signTransaction(0); 
      const balanceAfter = await hre.ethers.provider.getBalance(signer3.address);

      expect(balanceAfter > balanceBefore).to.be.true;
    });

    it("should revert if transaction already executed", async function () {
      const { multiSig, signer1, signer2, signer3 } = await loadFixture(deployMultiSig);

      await signer1.sendTransaction({
        to: multiSig.target,
        value: hre.ethers.parseEther("1.0"),
      });

      await multiSig.connect(signer1).proposeTransaction(signer3.address, hre.ethers.parseEther("0.5"));
      await multiSig.connect(signer2).signTransaction(0);
      await expect(
        multiSig.connect(signer1).signTransaction(0)
      ).to.be.revertedWithCustomError(multiSig, "TRANSACTION_ALREADY_EXECUTED");
    });
  });

  describe("Changing Required Signers", function () {
    it("should allow a signer to change required signers", async function () {
      const { multiSig, signer1 } = await loadFixture(deployMultiSig);
      await multiSig.connect(signer1).changeNoOfRequiredSigners(3);
      const required = await multiSig.getOfRequiredSigners();
      expect(required).to.equal(3n);
    });

    it("should revert if number is invalid", async function () {
      const { multiSig, signer1 } = await loadFixture(deployMultiSig);
      await expect(
        multiSig.connect(signer1).changeNoOfRequiredSigners(0)
      ).to.be.revertedWithCustomError(multiSig, "NOT_ENOUGH_REQUIRED_SIGNERS");
    });

    it("should revert if non-signer tries to change", async function () {
      const { multiSig, nonSigner } = await loadFixture(deployMultiSig);
      await expect(
        multiSig.connect(nonSigner).changeNoOfRequiredSigners(2)
      ).to.be.revertedWithCustomError(multiSig, "NOT_OWNER");
    });
  });
});

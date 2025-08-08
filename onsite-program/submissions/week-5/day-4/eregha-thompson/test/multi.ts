import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";

describe("multiSig", function () {
  async function deployMultisignature() {
    const [firstAddress, secondAddress, thirdAddress, nonAdmin] =
      await hre.ethers.getSigners();

    const Multisignature = await hre.ethers.getContractFactory("Multisig");
    const multi = await Multisignature.deploy([
      firstAddress,
      secondAddress,
      thirdAddress,
    ]);
    await firstAddress.sendTransaction({
      to: multi.target,
      value: hre.ethers.parseEther("9"),
    });

    return { multi, firstAddress, secondAddress, thirdAddress, nonAdmin };
  }

  describe("deployment", function () {
    it("should deploy properly", async function () {
      const { multi } = await loadFixture(deployMultisignature);

      const multiAddress = await multi.getAddress();
      expect(multiAddress).to.be.properAddress;
    });

    // it("it should set set admin", async function () {
    //   const { multi, firstAddress, secondAddress, thirdAddress, nonAdmin } = await loadFixture(
    //     deployMultisignature
    //   );

    //   const first = await multi.

    //   expect(multi);
    // });
  });

  describe("create", function () {
    it("should create transactions", async function () {
      const { multi, firstAddress, secondAddress, thirdAddress, nonAdmin } =
        await loadFixture(deployMultisignature);

      const spender = nonAdmin.getAddress();
      const amount = 2;

      await multi.createTransaction(await spender, amount);
      const allTransactions = await multi.getTransaction(1);
      console.log(allTransactions);

      //   expect(allTransactions.length).to.be.equal(1);
      expect(allTransactions.Amount).to.be.equal(amount);
      expect(allTransactions.isActive).to.be.equal(true);
      expect(allTransactions.numberOfApproval).to.be.equal(1);
    });
  });

  describe("approve", function () {
    it("same address should not appove transaction", async function () {
      const { multi, firstAddress, secondAddress, thirdAddress, nonAdmin } =
        await loadFixture(deployMultisignature);

      const spender = nonAdmin.getAddress();
      const amount = 2;

      await multi.createTransaction(await spender, amount);
       const isApproved = await multi.ApprovedTransaction(1);
      const allTransactions = await multi.getTransaction(1);
     
      console.log(isApproved);
      expect(isApproved).to.revertedWithCustomError(multi,"INVALID_ADDRESS")
    });
  });
});

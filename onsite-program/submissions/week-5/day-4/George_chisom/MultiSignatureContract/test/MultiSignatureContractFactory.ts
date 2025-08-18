import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Factory Test", function () {
  async function deployMultiSignatureAccount() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const MultiSignatureContractFactory = await hre.ethers.getContractFactory(
      "MultiSignatureContractFactory"
    );

    // Example: pass [owner.address, otherAccount.address] as owners and 1 as required confirmations
    const owners = [owner.address, otherAccount.address];
    const requiredConfirmations = 1;
    const multiSignatureAccount = await MultiSignatureContractFactory.deploy();

    return {
      multiSignatureAccount,
      owner,
      otherAccount,
      owners,
      requiredConfirmations,
    };
  }

  describe("MultiSignatureAccount Length", function () {
    it("This create factory", async function () {
      const { multiSignatureAccount } = await loadFixture(
        deployMultiSignatureAccount
      );

      // Check the owners length using the correct property or function
      const factory = await multiSignatureAccount.createMultiSignatureContract;
      const factoryLength = factory.length;

      expect(factoryLength).to.equals(0);
    });
  });

  describe("Get Deployed Contracts", function () {
    it("This Gets Deployed factory", async function () {
      const { multiSignatureAccount, owner, otherAccount } = await loadFixture(
        deployMultiSignatureAccount
      );

      await multiSignatureAccount.createMultiSignatureContract(
        [owner.address, otherAccount.address],
        1
      );
      // Check the owners length using the correct property or function
      const factory = await multiSignatureAccount.getDeployedContracts();
      const newFactory = factory[0];

      const multiSignatureContractAddress =
        await multiSignatureAccount.getDeployedContracts();

      expect(multiSignatureContractAddress).to.not.equals(0);
      expect(newFactory).to.not.equals(0);
    });
  });
});

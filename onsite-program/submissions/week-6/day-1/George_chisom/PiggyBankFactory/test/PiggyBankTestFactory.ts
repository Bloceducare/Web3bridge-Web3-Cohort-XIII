import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract, Signer } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import hre from "hardhat";

describe("ChildFactory Test", function () {
  async function deployChildFactoryFixture() {
    const [owner, user, otherAccount]: Signer[] = await hre.ethers.getSigners();

    // Deploy ChildFactory
    const ChildFactory = await hre.ethers.getContractFactory("ChildFactory");

    const childFactory = await ChildFactory.deploy();

    return { childFactory, owner, user, otherAccount };
  }

  describe("Factory Creation", function () {
    it("Should deploy a PiggyBank contract correctly", async function () {
      const { childFactory, owner, user } = await loadFixture(
        deployChildFactoryFixture
      );

      // Get addresses from signers
      const ownerAddress = await owner.getAddress();
      const userAddress = await user.getAddress();

      // Create a PiggyBank
      const tx = await childFactory.connect(user).createPiggyBank();
      await tx.wait();

      // Verify PiggyBank count
      const piggyBankCountBigInt = await childFactory.getUserPiggyBankCount(
        userAddress
      );
      const piggyBankCount: number = Number(piggyBankCountBigInt);
      expect(piggyBankCount).to.equal(1);

      // Verify PiggyBank address
      const piggyBanks: string[] = await childFactory.getUserPiggyBanks(
        userAddress
      );
      expect(piggyBanks[0]).to.not.equal(AddressZero);

      // Verify admin of the PiggyBank
      const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
      const piggyBank = PiggyBank.attach(piggyBanks[0]);

      expect(ownerAddress).to.equal(piggyBank);
    });
  });
});

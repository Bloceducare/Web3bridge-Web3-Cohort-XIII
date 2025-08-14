import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Lock", function () {
  async function deployOneYearLockFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const BiggyBankFactory = await hre.ethers.getContractFactory("BiggyBankFactory");
    const biggyBankFactory = await BiggyBankFactory.deploy();

    return { biggyBankFactory, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { biggyBankFactory, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

      
    });

  });
});

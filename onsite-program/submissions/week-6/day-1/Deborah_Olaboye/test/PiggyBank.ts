import { expect } from "chai";
import hre from "hardhat";
import { FactorySavings, PiggyBank } from "../typechain-types";

describe("FactorySavings & PiggyBank", function () {
  async function deployFactory() {
    const [owner, user1, user2] = await hre.ethers.getSigners();

    const Factory = await hre.ethers.getContractFactory("FactorySavings");
    const factory = (await Factory.deploy()) as unknown as FactorySavings;

    return { factory, owner, user1, user2 };
  }

  // describe("Deployment", function () {
  //   it("Should create a savings account with ETH", async function () {
  //     const { factory, user1 } = await deployFactory();

  //     await factory.connect(user1).createBank( "ETH savings", hre.ethers.ZeroAddress, hre.ethers.parseEther("1"), 60 * 60 * 24 * 30, { value: hre.ethers.parseEther("1") } );

  //     const banks = await factory.getUserBanks(user1.address);
  //     expect(banks.length).to.equal(1);
  //     expect(banks[0].bankName).to.equal("My ETH Bank");
  //   });
  // });

  describe("Joining Savings Account", function () {
    it("Should allow another user to join a bank with ETH", async function () {
      const { factory, user1, user2 } = await deployFactory();

      await factory.connect(user1).createBank( "Savings", hre.ethers.ZeroAddress, hre.ethers.parseEther("1"), 60 * 60 * 24 * 7, { value: hre.ethers.parseEther("1") });

      await factory.connect(user2).joinBank( user1.address, 0, hre.ethers.parseEther("0.5"), { value: hre.ethers.parseEther("0.5") });

      const balance = await factory.getTotalBalance(user1.address, hre.ethers.ZeroAddress);
      expect(balance).to.be.greaterThan(0n);
    });
  });
});

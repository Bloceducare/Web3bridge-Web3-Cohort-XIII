import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Piggybank", function () {
  async function deployPiggybankFixture() {
    const depositAmount = ethers.parseEther("1");
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

    const [factoryOwner, user, otherUser] = await ethers.getSigners();

    const Piggybank = await ethers.getContractFactory("Piggybank");
    const piggybank = await Piggybank.deploy(factoryOwner.address);

    // Deploy ERC20 mock token
    const TestToken = await ethers.getContractFactory("TestToken");
    const token = await TestToken.deploy(
      "TestToken",
      "TT",
      18,
      ethers.parseEther("1000")
    );

    return {
      piggybank,
      token,
      depositAmount,
      factoryOwner,
      user,
      otherUser,
      ONE_YEAR_IN_SECS,
    };
  }

  describe("Deposits", function () {
    it("Should allow ETH deposit", async function () {
      const { piggybank, depositAmount, user, ONE_YEAR_IN_SECS } =
        await loadFixture(deployPiggybankFixture);

      await expect(
        piggybank
          .connect(user)
          .deposit(depositAmount, ethers.ZeroAddress, ONE_YEAR_IN_SECS, {
            value: depositAmount,
          })
      ).to.emit(piggybank, "DepositMade"); // Optional: If you add event
    });

    it("Should allow ERC20 token deposit", async function () {
      const { piggybank, token, depositAmount, user, ONE_YEAR_IN_SECS } =
        await loadFixture(deployPiggybankFixture);

      // Transfer tokens to user first
      await token.transfer(user.address, depositAmount);

      await token.connect(user).approve(piggybank.target, depositAmount);

      await expect(
        piggybank
          .connect(user)
          .deposit(depositAmount, token.target, ONE_YEAR_IN_SECS)
      ).to.not.be.reverted;

      expect(await token.balanceOf(piggybank.target)).to.equal(depositAmount);
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawal after lock period", async function () {
      const { piggybank, depositAmount, user, ONE_YEAR_IN_SECS } =
        await loadFixture(deployPiggybankFixture);

      await piggybank
        .connect(user)
        .deposit(depositAmount, ethers.ZeroAddress, ONE_YEAR_IN_SECS, {
          value: depositAmount,
        });

      await time.increase(ONE_YEAR_IN_SECS + 1);

      const beforeBalance = await ethers.provider.getBalance(user.address);

      await piggybank.connect(user).withdraw(0);

      const afterBalance = await ethers.provider.getBalance(user.address);

      expect(afterBalance).to.be.gt(beforeBalance);
    });

    it("Should charge 3% fee for early withdrawal", async function () {
      const { piggybank, depositAmount, user, factoryOwner, ONE_YEAR_IN_SECS } =
        await loadFixture(deployPiggybankFixture);

      await piggybank
        .connect(user)
        .deposit(depositAmount, ethers.ZeroAddress, ONE_YEAR_IN_SECS, {
          value: depositAmount,
        });

      // Withdraw before lock expires
      const factoryOwnerBefore = await ethers.provider.getBalance(
        factoryOwner.address
      );
      await piggybank.connect(user).withdraw(0);
      const factoryOwnerAfter = await ethers.provider.getBalance(
        factoryOwner.address
      );

      const fee = (depositAmount * 3n) / 100n;
      expect(factoryOwnerAfter - factoryOwnerBefore).to.equal(fee);
    });
  });
});

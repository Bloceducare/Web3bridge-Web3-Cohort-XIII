import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import hre from "hardhat";

describe("Piggy vest", function () {
  async function deployPiggyVest() {
    const [owner, otherAddress, thirdAddress] = await hre.ethers.getSigners();
    const BREAKOUT = 3;

    const Piggy = await hre.ethers.getContractFactory("Savings_Account");
    const piggy = await Piggy.deploy(
      "testing",
      true,
      3600,
      owner.address,
      otherAddress.address
    );

    return { piggy, owner, otherAddress, thirdAddress };
  }

  describe("Deloyment", function () {
    it("should deploy succesfully", async function () {
      const { piggy } = await loadFixture(deployPiggyVest);
      expect(await piggy.getAddress()).to.be.properAddress;
    });
  });

  describe("deposit ether", function () {
    it("should deposit ether to the address", async function () {
      const { piggy, owner } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).deposit({
        value: depositAmount,
      });

      const balance = await hre.ethers.provider.getBalance(piggy.getAddress());
      expect(balance).to.equal(depositAmount);
    });
    it("should not deposit if not owner", async function () {
      const { piggy, owner, otherAddress, thirdAddress } = await loadFixture(
        deployPiggyVest
      );

      const depositAmount = hre.ethers.parseEther("1");
      await expect(
        piggy.connect(thirdAddress).deposit({
          value: depositAmount,
        })
      ).to.be.revertedWith("You are not the owner of this account.");
    });
    it("should not deposit if amount is zero", async function () {
      const { piggy, owner, otherAddress } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("0");
      await expect(
        piggy.connect(owner).deposit({
          value: depositAmount,
        })
      ).to.be.revertedWith("Value must be greater than 0");
    });
  });

  describe("withdraw ether", function(){
    it("should not withdraw if amount greater than balance", async function(){
      const { piggy, owner } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).deposit({
        value: depositAmount,
      });

      const initial_balance = await hre.ethers.provider.getBalance(piggy.getAddress());
      const withdrawAmount = hre.ethers.parseEther("2");
      await expect(piggy.connect(owner).withdraw(withdrawAmount)).to.be.revertedWith("invalid amount");
    });
    it("should not withdraw if not owner", async function(){
      const { piggy, owner, otherAddress } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).deposit({
        value: depositAmount,
      });

      const withdrawAmount = hre.ethers.parseEther("1");
      await expect(piggy.connect(otherAddress).withdraw(withdrawAmount)).to.be.revertedWith("You are not the owner of this account.");
    });
    it("should send break out fee to admin", async function(){
      const { piggy, owner, otherAddress } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).deposit({
        value: depositAmount,
      });
       
      const initial_Admin = await hre.ethers.provider.getBalance(otherAddress.getAddress())
       
      const withdrawAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).withdraw(withdrawAmount);
      const final_Admin = await hre.ethers.provider.getBalance(otherAddress.getAddress())
      const expectedFee = hre.ethers.parseEther("0.03");
      expect (final_Admin - initial_Admin).to.be.equal(expectedFee)

    })
  });
});

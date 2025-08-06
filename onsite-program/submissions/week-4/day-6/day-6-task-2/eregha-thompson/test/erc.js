import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

import { expect } from "chai";
import hre from "hardhat";

describe("ERC20", function () {
  async function deployERC20() {
    const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();

    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const erc20 = await ERC20.deploy("GODBRAND", "GOD", 8);
    await erc20._mint(owner.address, ethers.parseUnits("100000", 8));

    return { erc20, owner, otherAccount, thirdAccount };
  }


  describe("deployment", function(){
    it("should deploy successfully", async function (){
       const { erc20, owner, otherAccount } = await loadFixture(deployERC20);
       const address = await erc20.getAddress()
       expect(address).to.be.properAddress;

    })
    it("should have correct token details", async function(){
       const { erc20, owner, otherAccount } = await loadFixture(deployERC20);
      const [name, symbol,tokenSupply,decimals] = await erc20.getTokenDetails();
     
      
      expect(name).to.equal("GODBRAND")
      expect(symbol).to.equal("GOD")
      expect(tokenSupply).to.equal(0)
      expect(decimals).to.equal(0)
    })
  })
  //TESTS FOR TRANSFERS
  describe("Transfers", function () {
    it("Should transfer the funds to the reciever", async function () {
      const { erc20, owner, otherAccount } = await loadFixture(deployERC20);
      const initialOwnerBalance = await erc20.balanceOf(owner.address);
      const initialOtherBalance = await erc20.balanceOf(otherAccount.address);

      const amount = ethers.parseUnits("100", 8);

      await erc20.connect(owner).transfer(otherAccount.address, amount);

      expect(await erc20.balanceOf(owner.address)).to.equal(
        initialOwnerBalance - amount
      );
      expect(await erc20.balanceOf(otherAccount.address)).to.equal(
        initialOtherBalance + amount
      );
    });
    it("Should fail if the funds is greater than balance", async function () {
      const { erc20, owner, otherAccount } = await loadFixture(deployERC20);

      const amount = ethers.parseUnits("400000000", 8);

      await expect(
        erc20.connect(owner).transfer(otherAccount.address, amount)
      ).to.be.revertedWithCustomError(erc20, "INVALID_AMOUNT");
    });
    it("Should fail if the address is zero Address", async function () {
      const { erc20, owner } = await loadFixture(deployERC20);

      const amount = ethers.parseUnits("40", 8);

      await expect(
        erc20.connect(owner).transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(erc20, "INVALID_ADDRESS");
    });
  });

  //TESTS FOR BALANCE OF
  describe("BalanceOf", function () {
    it("Should check the balance of owner", async function () {
      const { erc20, owner } = await loadFixture(deployERC20);
      const initialOwnerBalance = await erc20.balanceOf(owner.address);

      expect(initialOwnerBalance).to.equal(ethers.parseUnits("100000", 8));

      
    });
    it("should check the balance of the other address", async function () {
      const { erc20, otherAccount } = await loadFixture(deployERC20);
      const initialOtherBalance = await erc20.balanceOf(otherAccount.address);
      expect(initialOtherBalance).to.equal(0);
    });
  });

  //TESTS FOR APPROVE AND ALLOWANCE
  describe("Approve", function () {
    it("should approve an amount of token to a third address", async function () {
      const { erc20, owner, thirdAccount } = await loadFixture(deployERC20);

      const amount = ethers.parseUnits("200", 8);

      await erc20.approve(thirdAccount.address, amount);

      const allowance = await erc20.allowance(
        owner.address,
        thirdAccount.address
      );
      expect(allowance).to.equal(amount);
    });
    it("should fail to approve an amount of token to a zero address", async function () {
      const { erc20, owner } = await loadFixture(deployERC20);

      const amount = ethers.parseUnits("200", 8);

      const allowance = await erc20.allowance(
        owner.address,
        ethers.ZeroAddress
      );
      await expect(
        erc20.connect(owner).approve(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(erc20, "INVALID_ADDRESS");
    });
  });

  //TESTS FOR TRANSFER FROM

  describe("transferFrom", function () {
    it("should transfer an approved amount of token from a third address", async function () {
      const { erc20, owner, thirdAccount, otherAccount } = await loadFixture(
        deployERC20
      );
      const initialOwnerBalance = await erc20.balanceOf(owner.address);
      const initialOtherBalance = await erc20.balanceOf(otherAccount.address);
      const approvedAmount = ethers.parseUnits("200", 8);
      const transferAmount = ethers.parseUnits("2", 8);
      await erc20.approve(thirdAccount.address, approvedAmount);

      await erc20
        .connect(thirdAccount)
        .transferFrom(owner.address, otherAccount.address, transferAmount);

      expect(await erc20.balanceOf(owner.address)).to.equal(
        initialOwnerBalance - transferAmount
      );
      expect(await erc20.balanceOf(otherAccount.address)).to.equal(
        initialOtherBalance + transferAmount
      );
    });
    it("should fail to transfer more than the approved amount", async function () {
      const { erc20, owner, thirdAccount, otherAccount } = await loadFixture(
        deployERC20
      );
      const approvedAmount = ethers.parseUnits("200", 8);
      const transferAmount = ethers.parseUnits("300", 8);

      await erc20.approve(thirdAccount.address, approvedAmount);

      await expect(
        erc20
          .connect(thirdAccount)
          .transferFrom(owner.address, otherAccount.address, transferAmount)
      ).to.be.revertedWithCustomError(erc20, "INVALID_AMOUNT");
    });
  });
});

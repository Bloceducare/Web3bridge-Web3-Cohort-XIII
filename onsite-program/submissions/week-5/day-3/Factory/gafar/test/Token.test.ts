import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Erc20", function () {
  
  async function deployToken() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const initialSupply = hre.ethers.parseUnits("5000000", 18);
    const Erc20 = await hre.ethers.getContractFactory("Erc20");
    const token = await Erc20.deploy("Scrimbda", "ISH", 18, initialSupply);

    return { token, initialSupply, owner, otherAccount };
  }

  describe("Name", function () {
    it("should get the name of the token", async function () {
      const { token } = await loadFixture(deployToken);
      const name = await token.name();

      expect(name).to.equal("Scrimbda");
    });
  });

  describe("Symbol", function () {
    it("should get the symbol of the token", async function () {
      const { token } = await loadFixture(deployToken);
      const symbol = await token.symbol();

      expect(symbol).to.equal("ISH");
    });
  });

  describe("Decimal", function () {
    it("should get the number of zeros", async function () {
      const { token } = await loadFixture(deployToken);
      const decimal = await token.decimals();

      expect(decimal).to.equal(18);
    });
  });

  describe("Total Supply", function () {
    it("should get total supply", async function () {
      const { token, initialSupply } = await loadFixture(deployToken);
      const totalSupply = await token.totalSupply();

      expect(totalSupply).to.equal(initialSupply);
    });
  });

  describe("BalanceOf", function () {
    it("should the balance of a user", async function () {
      const { token, owner, initialSupply } = await loadFixture(deployToken);
      const balanceOf = await token.balanceOf(owner.address);

      expect(balanceOf).to.equal(initialSupply);
    });
  });

  describe("Transfer", function () {
    it("should transfer token to another address", async function () {
      const { token, owner, otherAccount } = await loadFixture(deployToken);
      const amount = hre.ethers.parseUnits("1000", 18);
      await token.transfer(otherAccount.address, amount);
      // const ownerBalance = token.balanceOf(owner.address);
      // const ownerNewBalance = await ownerBalance - amount;
      const otherAccountBalance = await token.balanceOf(otherAccount);
      // const otherAccountNewBalance = otherAccountBalance + amount;

      // expect(ownerBalance).to.equal(initialSupply.sub(amount));
      expect(otherAccountBalance).to.equal(amount);
    });
  });

  describe("Approve", function () {
    it("should approve a user to spend his money", async function () {
      const { token, owner, initialSupply } = await loadFixture(deployToken);
      const balanceOf = await token.balanceOf(owner.address);

      expect(balanceOf).to.equal(initialSupply);
    });
  });

  describe("Transfer From", function () {
    it("should transfer token from an approved address to another address", async function () {
      const { token, owner, otherAccount } = await loadFixture(deployToken);
      const amount = hre.ethers.parseUnits("1000", 18);
      console.log("Amount", amount);
      await token.approve(otherAccount.address, amount);
      await token.allowance(owner.address, otherAccount.address);
      const ownerInitialBalance = await token.balanceOf(owner.address);
      const otherInitialBalance = await token.balanceOf(otherAccount.address);
      console.log("Owner Balance>>>>>>>>>>>", ownerInitialBalance);
      console.log("Other Balance>>>>>>>>>>>", otherInitialBalance);
      await token.connect(otherAccount).transferFrom(owner.address, otherAccount.address, amount);
      const finalOwnerBalance = await token.balanceOf(owner.address)
      const finalOtherBalance = await token.balanceOf(otherAccount.address);
      console.log("Final Owner Balance>>>>>>>>>>>", finalOwnerBalance);
      console.log("Other Balance>>>>>>>>>>>", finalOtherBalance);

      // expect(approvedBalance).to.equal(amount);
      // expect(await token.balanceOf(owner.address) - amount).to.equal(finalOwnerBalance);
      // expect(finalOtherBalance).to.equal(await token.balanceOf(otherAccount.address));
      expect(finalOwnerBalance).to.equal(ownerInitialBalance - amount);
      expect(finalOtherBalance).to.equal(otherInitialBalance + amount);
    });
  })
});

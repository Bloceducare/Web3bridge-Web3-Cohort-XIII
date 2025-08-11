import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFactory() {
  const [owner, user1, user2] = await ethers.getSigners();

  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();

  return { factory, owner, user1, user2 };
}

describe("Factory and SavingsAccount Testing", function () {
  
  describe("Factory Contract Tests", function () {
    
    it("Should set the correct admin", async function () {
      const { factory, owner } = await loadFixture(deployFactory);
      expect(await factory.admin()).to.equal(owner.address);
    });

    it("Should start with empty user accounts", async function () {
      const { factory, user1 } = await loadFixture(deployFactory);
      const userAccounts = await factory.getUserAccounts(user1.address);
      expect(userAccounts.length).to.equal(0);
    });

    it("Should create a new ETH savings account", async function () {
      const { factory, user1 } = await loadFixture(deployFactory);
      
      const lockDuration = 86400; // 1 day
      await factory.connect(user1).createSavingsAccount(ethers.ZeroAddress, lockDuration);
      
      const userAccounts = await factory.getUserAccounts(user1.address);
      expect(userAccounts.length).to.equal(1);
    });

    it("Should revert with zero lock duration", async function () {
      const { factory, user1 } = await loadFixture(deployFactory);
      
      await expect(
        factory.connect(user1).createSavingsAccount(ethers.ZeroAddress, 0)
      ).to.be.revertedWith("Lock duration must be > 0");
    });

    it("Should create multiple accounts for same user", async function () {
      const { factory, user1 } = await loadFixture(deployFactory);
      
      const lockDuration = 86400;
      
      await factory.connect(user1).createSavingsAccount(ethers.ZeroAddress, lockDuration);
      await factory.connect(user1).createSavingsAccount(ethers.ZeroAddress, lockDuration * 2);
      
      const userAccounts = await factory.getUserAccounts(user1.address);
      expect(userAccounts.length).to.equal(2);
    });
  });

  describe("SavingsAccount ETH Tests", function () {
    
    async function createETHAccount() {
      const { factory, owner, user1 } = await loadFixture(deployFactory);
      
      const lockDuration = 86400;
      await factory.connect(user1).createSavingsAccount(ethers.ZeroAddress, lockDuration);
      
      const userAccounts = await factory.getUserAccounts(user1.address);
      const savingsAccountAddress = userAccounts[0];
      
      const SavingsAccount = await ethers.getContractFactory("SavingsAccount");
      const savingsAccount = SavingsAccount.attach(savingsAccountAddress);
      
      return { factory, owner, user1, savingsAccount };
    }

  })
})
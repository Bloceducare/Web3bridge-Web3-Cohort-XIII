import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("PiggyBank", function () {

  async function deployPiggyBank() {

    const [owner, user1] = await hre.ethers.getSigners();

    const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
    const piggy = await PiggyBank.deploy(owner);

    return { piggy, owner, user1 };
  }

  describe("Deployment", function () {
    it("Should set next account ID", async ()=>{
      const{piggy} = await loadFixture(deployPiggyBank);
      expect(await piggy.nextAccountId()).to.equal(1);
    })
    it("should set owner address to deployer", async()=>{
      const{piggy, owner} = await loadFixture(deployPiggyBank);
      expect(await piggy.owner()).to.equal(owner.address);
    })
  })
  describe("Create account", function () {
    it("Should Create increment next account ID", async ()=>{
      const{piggy, user1} = await loadFixture(deployPiggyBank);
      const now = Math.floor(Date.now() / 1000);
      const unlockTime = now + 30 * 24 * 60 * 60;
      await piggy.create_account("Jackson", hre.ethers.ZeroAddress, unlockTime, 0);
      expect(await piggy.nextAccountId()).to.equal(2);
    });
    it("should update username", async()=>{
      const{piggy, user1} = await loadFixture(deployPiggyBank);
      const now = Math.floor(Date.now() / 1000);
      const unlockTime = now + 30 * 24 * 60 * 60;
      await piggy.create_account("Jackson", hre.ethers.ZeroAddress, unlockTime, 0);
      expect((await piggy.users(0)).name).to.equal("Jackson")
    })
    });
    describe("Deposit", ()=>{
      it("should carry out deposit", async()=>{
        const{piggy, user1} = await loadFixture(deployPiggyBank);
      const now = Math.floor(Date.now() / 1000);
      const unlockTime = now + 30 * 24 * 60 * 60;
      const _amount = hre.ethers.parseEther("10");
      const bal = (await piggy.users(0)).balance;
      await piggy.create_account("Jackson", hre.ethers.ZeroAddress, unlockTime, 0);
      await piggy.deposit(hre.ethers.ZeroAddress, 1, _amount);
      const _newbal = bal +_amount;
      expect(_newbal).to.equal(10);
      });
    })
  });
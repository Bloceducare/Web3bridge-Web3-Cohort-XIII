import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PiggyBank Factory Test", function () {
  async function deployContracts() {
    const [owner, user1, user2] = await hre.ethers.getSigners();
    
    const PiggyBankFactoryContract = await hre.ethers.getContractFactory("PiggyBankFactory");
    const factory = await PiggyBankFactoryContract.deploy();
    
    return { factory, owner, user1, user2 };
  }

  it("Should deploy factory and let user join", async function () {
    const { factory, user1 } = await loadFixture(deployContracts);
    
    await expect(factory.connect(user1).join())
      .to.emit(factory, "PiggyBankCreated");
    
    expect(await factory.totalUsers()).to.equal(1);
    
    const userInfo = await factory.users(user1.address);
    expect(userInfo.exists).to.be.true;
  });

  it("Should create account and deposit ETH", async function () {
    const { factory, user1 } = await loadFixture(deployContracts);
    
    await factory.connect(user1).join();
    const userInfo = await factory.users(user1.address);
    
    const PiggyBankContract = await hre.ethers.getContractFactory("PiggyBank");
    const userPiggyBank = PiggyBankContract.attach(userInfo.piggyBankAddress);
    
    await userPiggyBank.connect(user1).createSavingsAccount(86400, hre.ethers.ZeroAddress);
    await userPiggyBank.connect(user1).depositETH(0, { value: hre.ethers.parseEther("1") });
    
    expect(await factory.getUserAccountBalance(user1.address, 0)).to.equal(hre.ethers.parseEther("1"));
  });

  it("Should withdraw with fee for early withdrawal", async function () {
    const { factory, user1 } = await loadFixture(deployContracts);
    
    await factory.connect(user1).join();
    const userInfo = await factory.users(user1.address);
    
    const PiggyBankContract = await hre.ethers.getContractFactory("PiggyBank");
    const userPiggyBank = PiggyBankContract.attach(userInfo.piggyBankAddress);
    
    await userPiggyBank.connect(user1).createSavingsAccount(86400, hre.ethers.ZeroAddress);
    await userPiggyBank.connect(user1).depositETH(0, { value: hre.ethers.parseEther("1") });
    
    await expect(userPiggyBank.connect(user1)["withdraw(uint256,uint256)"](0, hre.ethers.parseEther("0.5")))
      .to.emit(userPiggyBank, "Withdrawn")
      .withArgs(0, hre.ethers.parseEther("0.5"), true, hre.ethers.parseEther("0.015"));
  });

  it("Should withdraw without fee after lock period", async function () {
    const { factory, user1 } = await loadFixture(deployContracts);
    
    await factory.connect(user1).join();
    const userInfo = await factory.users(user1.address);
    
    const PiggyBankContract = await hre.ethers.getContractFactory("PiggyBank");
    const userPiggyBank = PiggyBankContract.attach(userInfo.piggyBankAddress);
    
    await userPiggyBank.connect(user1).createSavingsAccount(86400, hre.ethers.ZeroAddress);
    await userPiggyBank.connect(user1).depositETH(0, { value: hre.ethers.parseEther("1") });
    
    await time.increase(86401);
    
    await expect(userPiggyBank.connect(user1)["withdraw(uint256)"](0))
      .to.emit(userPiggyBank, "Withdrawn")
      .withArgs(0, hre.ethers.parseEther("1"), false, 0);
  });
});
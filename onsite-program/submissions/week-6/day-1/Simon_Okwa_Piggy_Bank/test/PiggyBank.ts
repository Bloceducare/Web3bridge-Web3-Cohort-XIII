import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, BigNumberish } from "ethers";

type PiggyBank = any;
type PiggyBankFactory = any;

describe("PiggyBank", function () {
  let piggyBankFactory: PiggyBankFactory;
  let piggyBank: PiggyBank;
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let factoryAddress: string;

  const lockPeriod = 30 * 24 * 60 * 60; 
  const depositAmount = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();

    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    piggyBankFactory = await PiggyBankFactory.deploy();
    await piggyBankFactory.waitForDeployment();
    factoryAddress = await piggyBankFactory.getAddress();

 
    await piggyBankFactory.connect(user).createPiggyBank(lockPeriod, ethers.ZeroAddress, { value: depositAmount });
    const userPiggyBanks = await piggyBankFactory.getUserPiggyBanks(userAddress);
    const piggyBankAddress = userPiggyBanks[0];
    
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    piggyBank = PiggyBank.attach(piggyBankAddress) as PiggyBank;
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await piggyBank.owner()).to.equal(userAddress);
    });

    it("Should set the correct lock period", async function () {
      expect(await piggyBank.lockPeriod()).to.equal(lockPeriod);
    });

    it("Should set the correct factory address", async function () {
      expect(await piggyBank.factory()).to.equal(factoryAddress);
    });

    it("Should set the correct creation timestamp", async function () {
      const createdAt = await piggyBank.createdAt();
      expect(createdAt).to.be.gt(0);
    });

    it("Should set token address to zero for Ether", async function () {
      expect(await piggyBank.tokenAddress()).to.equal(ethers.ZeroAddress);
    });

    it("Should have initial balance from creation", async function () {
      expect(await piggyBank.balance()).to.equal(depositAmount);
    });
  });

  describe("Deposits", function () {
    it("Should accept Ether deposits", async function () {
      const additionalDeposit = ethers.parseEther("0.5");
      const initialBalance = await piggyBank.balance();
      
      await piggyBank.connect(user).deposit(additionalDeposit, { value: additionalDeposit });
      
      expect(await piggyBank.balance()).to.equal(initialBalance + additionalDeposit);
    });

    it("Should emit Deposited event", async function () {
      const additionalDeposit = ethers.parseEther("0.5");
      
      await expect(piggyBank.connect(user).deposit(additionalDeposit, { value: additionalDeposit }))
        .to.emit(piggyBank, "Deposited")
        .withArgs(userAddress, additionalDeposit, await time());
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawal after lock period", async function () {
     
      await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
      await ethers.provider.send("evm_mine", []);
      
      const initialBalance = await piggyBank.balance();
      const withdrawalAmount = ethers.parseEther("0.5");
      
      await piggyBank.connect(user).withdraw(withdrawalAmount);
      
      expect(await piggyBank.balance()).to.equal(initialBalance - withdrawalAmount);
    });

    it("Should charge early withdrawal fee", async function () {
      const withdrawalAmount = ethers.parseEther("0.5");
      const feeAmount = (withdrawalAmount * 3n) / 100n; 
      
      await expect(piggyBank.connect(user).withdraw(withdrawalAmount))
        .to.emit(piggyBank, "EarlyWithdrawalFee")
        .withArgs(userAddress, feeAmount, await time());
    });

    it("Should transfer fee to factory owner", async function () {
      const withdrawalAmount = ethers.parseEther("0.5");
      const feeAmount = (withdrawalAmount * 3n) / 100n;
      const factoryOwnerBalanceBefore = await ethers.provider.getBalance(ownerAddress);
      
      await piggyBank.connect(user).withdraw(withdrawalAmount);
      
      const factoryOwnerBalanceAfter = await ethers.provider.getBalance(ownerAddress);
      expect(factoryOwnerBalanceAfter).to.equal(factoryOwnerBalanceBefore + feeAmount);
    });

    it("Should emit Withdrawn event", async function () {
      const withdrawalAmount = ethers.parseEther("0.5");
      const feeAmount = (withdrawalAmount * 3n) / 100n;
      const actualAmount = withdrawalAmount - feeAmount;
      
      await expect(piggyBank.connect(user).withdraw(withdrawalAmount))
        .to.emit(piggyBank, "Withdrawn")
        .withArgs(userAddress, actualAmount, await time());
    });
  });

  describe("Closing", function () {
    it("Should allow owner to close piggy bank", async function () {
    
      await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await piggyBank.connect(user).close();
      expect(await piggyBank.isClosed()).to.be.true;
    });

    it("Should emit Closed event", async function () {
      
      await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(piggyBank.connect(user).close())
        .to.emit(piggyBank, "Closed")
        .withArgs(userAddress, await time());
    });

    it("Should not allow non-owner to close", async function () {
      await expect(piggyBank.connect(owner).close()).to.be.revertedWithCustomError(piggyBank, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Close", function () {
    it("Should allow factory to emergency close", async function () {
      await piggyBankFactory.connect(owner).emergencyClosePiggyBank(await piggyBank.getAddress());
      expect(await piggyBank.isClosed()).to.be.true;
    });

    it("Should not allow non-factory to emergency close", async function () {
      await expect(piggyBank.connect(user).emergencyClose()).to.be.revertedWith("Only factory can emergency close");
    });
  });

  describe("View Functions", function () {
    it("Should return correct balance", async function () {
      expect(await piggyBank.getBalance()).to.equal(depositAmount);
    });

    it("Should return correct lock end time", async function () {
      const createdAt = await piggyBank.createdAt();
      const lockPeriod = await piggyBank.lockPeriod();
      expect(await piggyBank.getLockEndTime()).to.equal(createdAt + lockPeriod);
    });

    it("Should return correct time remaining", async function () {
      const timeRemaining = await piggyBank.getTimeRemaining();
      expect(timeRemaining).to.be.gte(0);
    });

    it("Should return correct early withdrawal fee", async function () {
      const amount = ethers.parseEther("1.0");
      const fee = await piggyBank.getEarlyWithdrawalFee(amount);
      expect(fee).to.equal((amount * 3n) / 100n);
    });
  });

  describe("Receive Function", function () {
    it("Should accept Ether via receive function", async function () {
      const initialBalance = await piggyBank.balance();
      const sentAmount = ethers.parseEther("0.3");
      
      await user.sendTransaction({
        to: await piggyBank.getAddress(),
        value: sentAmount
      });
      
      expect(await piggyBank.balance()).to.equal(initialBalance + sentAmount);
    });
  });
});


async function time(): Promise<number> {
  const blockNum = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNum);
  return block!.timestamp;
}

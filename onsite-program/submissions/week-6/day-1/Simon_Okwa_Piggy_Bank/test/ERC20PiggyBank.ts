import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, BigNumberish } from "ethers";

type PiggyBank = any;
type PiggyBankFactory = any;
type TestToken = any;

describe("ERC20 PiggyBank", function () {
  let piggyBankFactory: PiggyBankFactory;
  let testToken: TestToken;
  let piggyBank: PiggyBank;
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let factoryAddress: string;
  let tokenAddress: string;

  const lockPeriod = 30 * 24 * 60 * 60; 
  const depositAmount = ethers.parseEther("100.0");
  const tokenAmount = ethers.parseEther("1000.0");

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();

    
    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy();
    await testToken.waitForDeployment();
    tokenAddress = await testToken.getAddress();

 
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    piggyBankFactory = await PiggyBankFactory.deploy();
    await piggyBankFactory.waitForDeployment();
    factoryAddress = await piggyBankFactory.getAddress();

    
    await testToken.connect(owner).mint(userAddress, tokenAmount);

 
    await piggyBankFactory.connect(user).createPiggyBank(lockPeriod, tokenAddress);
    const userPiggyBanks = await piggyBankFactory.getUserPiggyBanks(userAddress);
    const piggyBankAddress = userPiggyBanks[0];
    
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    piggyBank = PiggyBank.attach(piggyBankAddress) as PiggyBank;
    
   
    await testToken.connect(user).approve(piggyBankAddress, tokenAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await piggyBank.tokenAddress()).to.equal(tokenAddress);
    });

    it("Should have zero initial balance", async function () {
      expect(await piggyBank.balance()).to.equal(0);
    });
  });

  describe("ERC20 Deposits", function () {
    it("Should accept ERC20 token deposits", async function () {
      const initialBalance = await piggyBank.balance();
      const userTokenBalance = await testToken.balanceOf(userAddress);
      
      await piggyBank.connect(user).deposit(depositAmount);
      
      expect(await piggyBank.balance()).to.equal(initialBalance + depositAmount);
      expect(await testToken.balanceOf(userAddress)).to.equal(userTokenBalance - depositAmount);
    });

    it("Should emit Deposited event for ERC20", async function () {
      await expect(piggyBank.connect(user).deposit(depositAmount))
        .to.emit(piggyBank, "Deposited")
        .withArgs(userAddress, depositAmount, await time());
    });

    it("Should require sufficient token approval", async function () {
      // Revoke approval
      await testToken.connect(user).approve(await piggyBank.getAddress(), 0);
      
      await expect(
        piggyBank.connect(user).deposit(depositAmount)
      ).to.be.revertedWithCustomError(testToken, "ERC20InsufficientAllowance");
    });
  });

  describe("ERC20 Withdrawals", function () {
    beforeEach(async function () {
      await piggyBank.connect(user).deposit(depositAmount);
    });

    it("Should allow withdrawal after lock period", async function () {
      
     await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
     await ethers.provider.send("evm_mine", []);
      
      const initialBalance = await piggyBank.balance();
      const withdrawalAmount = ethers.parseEther("50.0");
      const userTokenBalanceBefore = await testToken.balanceOf(userAddress);
      
      await piggyBank.connect(user).withdraw(withdrawalAmount);
      
      expect(await piggyBank.balance()).to.equal(initialBalance - withdrawalAmount);
      expect(await testToken.balanceOf(userAddress)).to.equal(userTokenBalanceBefore + withdrawalAmount);
    });

    it("Should charge early withdrawal fee for ERC20", async function () {
      const withdrawalAmount = ethers.parseEther("50.0");
      const feeAmount = (withdrawalAmount * 3n) / 100n; // 3% fee
      
      await expect(piggyBank.connect(user).withdraw(withdrawalAmount))
        .to.emit(piggyBank, "EarlyWithdrawalFee")
        .withArgs(userAddress, feeAmount, await time());
    });

    it("Should transfer ERC20 fee to factory owner", async function () {
      const withdrawalAmount = ethers.parseEther("50.0");
      const feeAmount = (withdrawalAmount * 3n) / 100n;
      const factoryOwnerTokenBalanceBefore = await testToken.balanceOf(ownerAddress);
      
      await piggyBank.connect(user).withdraw(withdrawalAmount);
      
      const factoryOwnerTokenBalanceAfter = await testToken.balanceOf(ownerAddress);
      expect(factoryOwnerTokenBalanceAfter).to.equal(factoryOwnerTokenBalanceBefore + feeAmount);
    });

    it("Should emit Withdrawn event for ERC20", async function () {
      const withdrawalAmount = ethers.parseEther("50.0");
      const feeAmount = (withdrawalAmount * 3n) / 100n;
      const actualAmount = withdrawalAmount - feeAmount;
      
      await expect(piggyBank.connect(user).withdraw(withdrawalAmount))
        .to.emit(piggyBank, "Withdrawn")
        .withArgs(userAddress, actualAmount, await time());
    });
  });

  describe("ERC20 Closing", function () {
    beforeEach(async function () {
      await piggyBank.connect(user).deposit(depositAmount);
    });

    it("Should return remaining tokens to owner on close", async function () {
    
      await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
      await ethers.provider.send("evm_mine", []);
      
      const userTokenBalanceBefore = await testToken.balanceOf(userAddress);
      const piggyBankBalance = await piggyBank.balance();
      
      await piggyBank.connect(user).close();
      
      expect(await piggyBank.isClosed()).to.be.true;
      expect(await testToken.balanceOf(userAddress)).to.equal(userTokenBalanceBefore + piggyBankBalance);
    });

    it("Should emit Closed event", async function () {
      
      await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(piggyBank.connect(user).close())
        .to.emit(piggyBank, "Closed")
        .withArgs(userAddress, await time());
    });
  });

  describe("Factory Fee Collection for ERC20", function () {
    beforeEach(async function () {
      await piggyBank.connect(user).deposit(depositAmount);
    
      await piggyBank.connect(user).withdraw(ethers.parseEther("10.0"));
    });

    it("Should allow admin to withdraw ERC20 fees", async function () {
      const factoryOwnerTokenBalanceBefore = await testToken.balanceOf(ownerAddress);
      const factoryTokenBalance = await testToken.balanceOf(factoryAddress);
      
      await piggyBankFactory.connect(owner).withdrawFees(tokenAddress, factoryTokenBalance);
      
      const factoryOwnerTokenBalanceAfter = await testToken.balanceOf(ownerAddress);
      expect(factoryOwnerTokenBalanceAfter).to.equal(factoryOwnerTokenBalanceBefore + factoryTokenBalance);
    });

    it("Should not allow non-admin to withdraw fees", async function () {
      await expect(
        piggyBankFactory.connect(user).withdrawFees(tokenAddress, ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(piggyBankFactory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Mixed Token Operations", function () {
    it("Should handle both ERC20 and Ether piggy banks for same user", async function () {
     
      await piggyBankFactory.connect(user).createPiggyBank(lockPeriod, ethers.ZeroAddress, { value: ethers.parseEther("1.0") });
      
   
      const userPiggyBanks = await piggyBankFactory.getUserPiggyBanks(userAddress);
      expect(userPiggyBanks).to.have.lengthOf(2);
      
  
      const userBalance = await piggyBankFactory.getUserBalance(userAddress);
      expect(userBalance).to.be.gt(0);
    });
  });


async function time(): Promise<number> {
  const blockNum = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNum);
  return block!.timestamp;
}
});

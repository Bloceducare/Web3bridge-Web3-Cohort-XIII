import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PigiVest", function () {
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  
  let PigiVestToken: any;
  let pigiVestToken: any;
  
  let PigiVestFactory: any;
  let pigiVestFactory: any;
  
  let PigiVestEther: any;
  let PigiVestERC20: any;

  const ONE_DAY_IN_SECS = 24 * 60 * 60;
  const UNLOCK_TIME = Math.floor(Date.now() / 1000) + ONE_DAY_IN_SECS;
  const DEPOSIT_AMOUNT = ethers.parseEther("1.0");
  const TOKEN_SUPPLY = ethers.parseEther("1000");

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const ownerAddress = await owner.getAddress();
    const user1Address = await user1.getAddress();

    // Deploy test ERC20 token
    PigiVestToken = await ethers.getContractFactory("PigiVestToken");
    pigiVestToken = await PigiVestToken.deploy();
    await pigiVestToken.waitForDeployment();
    
    // Mint tokens to user1
    await (await pigiVestToken.mint(user1Address, TOKEN_SUPPLY)).wait();
    
    // Deploy PigiVestFactory
    PigiVestFactory = await ethers.getContractFactory("PigiVestFactory");
    pigiVestFactory = await PigiVestFactory.deploy();
    await pigiVestFactory.waitForDeployment();
    
    // Deploy implementations with required constructor arguments
    const PigiVestEtherFactory = await ethers.getContractFactory("PigiVestEther");
    const PigiVestERC20Factory = await ethers.getContractFactory("PigiVestERC20");
    
    // Deploy with mock values that will be overridden by the factory
    const mockUnlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    
    // Deploy implementations with required constructor arguments
    const etherImplementation = await PigiVestEtherFactory.deploy(
      ownerAddress,
      mockUnlockTime,
      ownerAddress
    );
    
    const erc20Implementation = await PigiVestERC20Factory.deploy(
      ownerAddress,
      mockUnlockTime,
      await pigiVestToken.getAddress(),
      ownerAddress
    );
    
    // Wait for deployments to complete
    await etherImplementation.waitForDeployment();
    await erc20Implementation.waitForDeployment();
    
    PigiVestEther = await ethers.getContractAt("PigiVestEther", await etherImplementation.getAddress());
    PigiVestERC20 = await ethers.getContractAt("PigiVestERC20", await erc20Implementation.getAddress());
  });

  describe("PigiVestToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await pigiVestToken.name()).to.equal("PIGI-VEST-TOKEN");
      expect(await pigiVestToken.symbol()).to.equal("PIGI");
    });

    it("Should allow owner to mint tokens", async function () {
      const user1Address = await user1.getAddress();
      const balanceBefore = await pigiVestToken.balanceOf(user1Address);
      await pigiVestToken.mint(user1Address, DEPOSIT_AMOUNT);
      const balanceAfter = await pigiVestToken.balanceOf(user1Address);
      expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("PigiVestFactory", function () {
    it("Should deploy with correct owner", async function () {
      expect(await pigiVestFactory.factoryDeployer()).to.equal(await owner.getAddress());
    });

    it("Should create a new Ether savings account", async function () {
      const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // Create account with initial deposit
      const tx = await pigiVestFactory.connect(user1).createEtherSavings(unlockTime, { 
        value: DEPOSIT_AMOUNT 
      });
      
      await expect(tx).to.emit(pigiVestFactory, "PiggyBankCreated");
      
      // Get the created account
      const accounts = await pigiVestFactory.getUserAccounts(await user1.getAddress());
      expect(accounts.length).to.equal(1);
      
      // Verify account details
      const accountDetails = await pigiVestFactory.getAccountDetails(accounts[0].accountAddress);
      expect(accountDetails.isERC20).to.be.false;
      expect(accountDetails.balance).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should create a new ERC20 savings account", async function () {
      const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // Approve tokens first
      await pigiVestToken.connect(user1).approve(pigiVestFactory.target, DEPOSIT_AMOUNT);
      
      // Create ERC20 savings account
      const tx = await pigiVestFactory.connect(user1).createERC20Savings(
        await pigiVestToken.getAddress(),
        unlockTime
      );
      
      await expect(tx).to.emit(pigiVestFactory, "PiggyBankCreated");
      
      // Get the created account
      const accounts = await pigiVestFactory.getUserAccounts(await user1.getAddress());
      const erc20Accounts = accounts.filter((acc: any) => acc.isERC20);
      expect(erc20Accounts.length).to.be.gt(0);
      
      // Verify account details
      const accountDetails = erc20Accounts[0];
      expect(accountDetails.tokenAddress).to.equal(await pigiVestToken.getAddress());
      expect(accountDetails.balance).to.equal(0); // Initial balance is 0
    });
  });

  describe("PigiVestEther", function () {
    let etherAccount: any;
    let unlockTime: number;
    
    beforeEach(async function () {
      // Create a new Ether savings account
      unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      await pigiVestFactory.connect(user1).createEtherSavings(unlockTime, { 
        value: DEPOSIT_AMOUNT 
      });
      
      const accounts = await pigiVestFactory.getUserAccounts(await user1.getAddress());
      const etherAccounts = accounts.filter((acc: any) => !acc.isERC20);
      
      if (etherAccounts.length === 0) {
        throw new Error("No Ether accounts found");
      }
      
      etherAccount = await ethers.getContractAt(
        "PigiVestEther", 
        etherAccounts[0].accountAddress
      );
    });

    it("Should deposit Ether correctly", async function () {
      const balanceBefore = await ethers.provider.getBalance(etherAccount.target);
      
      // Deposit using the receive function
      await user1.sendTransaction({
        to: etherAccount.target,
        value: DEPOSIT_AMOUNT
      });
      
      const balanceAfter = await ethers.provider.getBalance(etherAccount.target);
      expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should not allow withdrawal before unlock time", async function () {
      // Try to withdraw before unlock time
      await expect(etherAccount.connect(user1).withdrawETH())
        .to.be.revertedWithCustomError(etherAccount, "WithdrawalBeforeUnlockTime");
      
      // Try early withdrawal (should work but with fee)
      const balanceBefore = await ethers.provider.getBalance(await user1.getAddress());
      const tx = await etherAccount.connect(user1).withdrawBeforeUnlockTime();
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed * (receipt?.gasPrice || 0n);
      const balanceAfter = await ethers.provider.getBalance(await user1.getAddress());
      
      // Check that the user received most of their ETH back (minus gas and 3% fee)
      const expectedAmount = (DEPOSIT_AMOUNT * 97n) / 100n; // 3% fee
      const expectedBalance = (BigInt(balanceBefore) + BigInt(expectedAmount) - (BigInt(gasUsed) || 0n)).toString();
      
      // Allow for some leeway in the balance check due to gas costs
      const balanceAfterBigInt = BigInt(balanceAfter);
      const expectedBalanceBigInt = BigInt(expectedBalance);
      const diff = balanceAfterBigInt > expectedBalanceBigInt 
        ? balanceAfterBigInt - expectedBalanceBigInt 
        : expectedBalanceBigInt - balanceAfterBigInt;
      expect(diff).to.be.lte(ethers.parseEther("0.1"));
    });

    it("Should allow withdrawal after unlock time", async function () {
      // Fast forward time past unlock time
      await time.increase(ONE_DAY_IN_SECS + 1);
      
      // Make another deposit to test withdrawal
      await user1.sendTransaction({
        to: etherAccount.target,
        value: DEPOSIT_AMOUNT
      });
      
      const balanceBefore = await ethers.provider.getBalance(await user1.getAddress());
      const contractBalanceBefore = await ethers.provider.getBalance(etherAccount.target);
      
      // Withdraw after unlock time
      const tx = await etherAccount.connect(user1).withdrawETH();
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed * (receipt?.gasPrice || 0n);
      
      const balanceAfter = await ethers.provider.getBalance(await user1.getAddress());
      const contractBalanceAfter = await ethers.provider.getBalance(etherAccount.target);
      
      // Check that contract balance is now 0
      expect(contractBalanceAfter).to.equal(0);
      
      // Check that user received their ETH back (minus gas)
      const expectedBalance = (BigInt(balanceBefore) + BigInt(contractBalanceBefore) - BigInt(gasUsed || 0n)).toString();
      const balanceAfterBigInt = BigInt(balanceAfter);
      const expectedBalanceBigInt = BigInt(expectedBalance);
      const diff = balanceAfterBigInt > expectedBalanceBigInt 
        ? balanceAfterBigInt - expectedBalanceBigInt 
        : expectedBalanceBigInt - balanceAfterBigInt;
      expect(diff).to.be.lte(ethers.parseEther("0.1"));
    });
  });

  describe("PigiVestERC20", function () {
    let erc20Account: any;
    let unlockTime: number;
    
    beforeEach(async function () {
      unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const user1Address = await user1.getAddress();
      const factoryAddress = await pigiVestFactory.getAddress();
      const tokenAddress = await pigiVestToken.getAddress();
      
      // Approve tokens first
      await (await pigiVestToken.connect(user1).approve(factoryAddress, DEPOSIT_AMOUNT * 2n)).wait();
      
      // Create ERC20 savings account and wait for the transaction to be mined
      const tx = await pigiVestFactory.connect(user1).createERC20Savings(
        tokenAddress,
        unlockTime
      );
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error("Transaction receipt is null");
      }
      
      // Get the created account from the event
      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === "PiggyBankCreated" && log.fragment.inputs[1].name === "contractAddress"
      );
      
      if (!event) {
        throw new Error("PiggyBankCreated event not found");
      }
      
      // Decode the event data to get the contract address
      const decodedEvent = pigiVestFactory.interface.decodeEventLog(
        "PiggyBankCreated",
        event.data,
        event.topics
      );
      
      const accountAddress = decodedEvent.contractAddress;
      
      // Get the contract instance
      erc20Account = await ethers.getContractAt("PigiVestERC20", accountAddress);
      
      // Verify the account was created correctly
      expect(await erc20Account.owner()).to.equal(user1Address);
      expect(await erc20Account.unlockTime()).to.equal(unlockTime);
      
      // Approve tokens for the account
      await pigiVestToken.connect(user1).approve(accountAddress, DEPOSIT_AMOUNT * 2n);
    });

    it("Should deposit ERC20 tokens correctly", async function () {
      const balanceBefore = await pigiVestToken.balanceOf(erc20Account.target);
      
      // Deposit tokens
      await erc20Account.connect(user1).depositERC20(DEPOSIT_AMOUNT);
      
      const balanceAfter = await pigiVestToken.balanceOf(erc20Account.target);
      expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
      
      // Check the contract's internal balance tracking
      const contractBalance = await erc20Account.getERC20Balance();
      expect(contractBalance).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should not allow withdrawal before unlock time", async function () {
      // First, deposit some tokens
      await erc20Account.connect(user1).depositERC20(DEPOSIT_AMOUNT);
      
      // Try to withdraw before unlock time (should fail)
      await expect(erc20Account.connect(user1).withdrawERC20())
        .to.be.revertedWithCustomError(erc20Account, "WithdrawalBeforeUnlockTime");
    });

    it("Should charge fee for early withdrawal", async function () {
      // First, deposit some tokens
      await erc20Account.connect(user1).depositERC20(DEPOSIT_AMOUNT);
      
      // Get initial balances
      const userBalanceBefore = await pigiVestToken.balanceOf(await user1.getAddress());
      const factoryBalanceBefore = await pigiVestToken.balanceOf(await owner.getAddress());
      
      // Perform early withdrawal
      const tx = await erc20Account.connect(user1).withdrawBeforeUnlockTime();
      await expect(tx)
        .to.emit(erc20Account, "Withdraw")
        .withArgs(await user1.getAddress(), (DEPOSIT_AMOUNT * 97n) / 100n)
        .to.emit(erc20Account, "Credit3PercentWithdrawal")
        .withArgs(await owner.getAddress(), (DEPOSIT_AMOUNT * 3n) / 100n);
      
      // Check final balances
      const userBalanceAfter = await pigiVestToken.balanceOf(await user1.getAddress());
      const factoryBalanceAfter = await pigiVestToken.balanceOf(await owner.getAddress());
      
      // User should receive 97% of their deposit back
      expect(userBalanceAfter - userBalanceBefore).to.equal((DEPOSIT_AMOUNT * 97n) / 100n);
      
      // Factory should receive 3% fee
      expect(factoryBalanceAfter - factoryBalanceBefore).to.equal((DEPOSIT_AMOUNT * 3n) / 100n);
      
      // Contract balance should be 0
      expect(await pigiVestToken.balanceOf(erc20Account.target)).to.equal(0);
    });
    
    it("Should allow withdrawal after unlock time", async function () {
      // First, deposit some tokens
      await erc20Account.connect(user1).depositERC20(DEPOSIT_AMOUNT);
      
      // Fast forward time past unlock time
      await time.increase(ONE_DAY_IN_SECS + 1);
      
      // Get initial balances
      const userBalanceBefore = await pigiVestToken.balanceOf(await user1.getAddress());
      
      // Withdraw after unlock time
      await expect(erc20Account.connect(user1).withdrawERC20())
        .to.emit(erc20Account, "Withdraw")
        .withArgs(await user1.getAddress(), DEPOSIT_AMOUNT);
      
      // Check final balance
      const userBalanceAfter = await pigiVestToken.balanceOf(await user1.getAddress());
      
      // User should receive 100% of their deposit back (no fee after unlock)
      expect(userBalanceAfter - userBalanceBefore).to.equal(DEPOSIT_AMOUNT);
      
      // Contract balance should be 0
      expect(await pigiVestToken.balanceOf(erc20Account.target)).to.equal(0);
    });

    it("Should allow withdrawal after unlock time", async function () {
      // Fast forward time
      await time.increase(ONE_DAY_IN_SECS + 1);
      
      const balanceBefore = await pigiVestToken.balanceOf(await user1.getAddress());
      await erc20Account.connect(user1).withdrawERC20();
      const balanceAfter = await pigiVestToken.balanceOf(await user1.getAddress());
      
      expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
    });
  });
});

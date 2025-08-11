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

    // Deploy test ERC20 token
    PigiVestToken = await ethers.getContractFactory("PigiVestToken");
    pigiVestToken = await PigiVestToken.deploy();
    
    // Mint tokens to user1
    await pigiVestToken.mint(await user1.getAddress(), TOKEN_SUPPLY);
    
    // Deploy PigiVestFactory
    PigiVestFactory = await ethers.getContractFactory("PigiVestFactory");
    pigiVestFactory = await PigiVestFactory.deploy();
    
    // Get the deployed implementations
    const etherAddress = await pigiVestFactory.pigiVestEtherImplementation();
    const erc20Address = await pigiVestFactory.pigiVestERC20Implementation();
    
    PigiVestEther = await ethers.getContractAt("PigiVestEther", etherAddress);
    PigiVestERC20 = await ethers.getContractAt("PigiVestERC20", erc20Address);
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
      const tx = await pigiVestFactory.connect(user1).createPiggyBank(0, ethers.ZeroAddress, UNLOCK_TIME, { value: DEPOSIT_AMOUNT });
      await expect(tx).to.emit(pigiVestFactory, "PiggyBankCreated").withArgs(
        await user1.getAddress(),
        true, // isEther
        ethers.ZeroAddress,
        UNLOCK_TIME,
        DEPOSIT_AMOUNT
      );
    });

    it("Should create a new ERC20 savings account", async function () {
      // Approve tokens first
      await pigiVestToken.connect(user1).approve(pigiVestFactory.target, DEPOSIT_AMOUNT);
      
      const tx = await pigiVestFactory.connect(user1).createPiggyBank(1, pigiVestToken.target, UNLOCK_TIME, { value: 0 });
      await expect(tx).to.emit(pigiVestFactory, "PiggyBankCreated").withArgs(
        await user1.getAddress(),
        false, // isERC20
        pigiVestToken.target,
        UNLOCK_TIME,
        DEPOSIT_AMOUNT
      );
    });
  });

  describe("PigiVestEther", function () {
    let etherAccount: any;
    
    beforeEach(async function () {
      // Create a new Ether savings account
      await pigiVestFactory.connect(user1).createPiggyBank(0, ethers.ZeroAddress, UNLOCK_TIME, { value: DEPOSIT_AMOUNT });
      const accounts = await pigiVestFactory.getUserAccounts(await user1.getAddress());
      etherAccount = await ethers.getContractAt("PigiVestEther", accounts[0]);
    });

    it("Should deposit Ether correctly", async function () {
      const balanceBefore = await ethers.provider.getBalance(etherAccount.target);
      await etherAccount.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      const balanceAfter = await ethers.provider.getBalance(etherAccount.target);
      expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should not allow withdrawal before unlock time", async function () {
      await expect(etherAccount.connect(user1).withdraw()).to.be.revertedWith("Not yet unlocked");
    });

    it("Should allow withdrawal after unlock time", async function () {
      // Fast forward time
      await time.increase(ONE_DAY_IN_SECS + 1);
      
      const balanceBefore = await ethers.provider.getBalance(await user1.getAddress());
      const tx = await etherAccount.connect(user1).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed * receipt?.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(await user1.getAddress());
      
      const expectedBalance = balanceBefore + DEPOSIT_AMOUNT - (gasUsed || 0n);
      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.1"));
    });
  });

  describe("PigiVestERC20", function () {
    let erc20Account: any;
    
    beforeEach(async function () {
      // Approve tokens first
      await pigiVestToken.connect(user1).approve(pigiVestFactory.target, DEPOSIT_AMOUNT);
      
      // Create a new ERC20 savings account
      await pigiVestFactory.connect(user1).createPiggyBank(1, pigiVestToken.target, UNLOCK_TIME, { value: 0 });
      const accounts = await pigiVestFactory.getUserAccounts(await user1.getAddress());
      erc20Account = await ethers.getContractAt("PigiVestERC20", accounts[1]);
    });

    it("Should deposit ERC20 tokens correctly", async function () {
      // Approve more tokens
      await pigiVestToken.connect(user1).approve(erc20Account.target, DEPOSIT_AMOUNT);
      
      const balanceBefore = await pigiVestToken.balanceOf(erc20Account.target);
      await erc20Account.connect(user1).depositERC20(DEPOSIT_AMOUNT);
      const balanceAfter = await pigiVestToken.balanceOf(erc20Account.target);
      expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should not allow withdrawal before unlock time", async function () {
      await expect(erc20Account.connect(user1).withdrawERC20()).to.be.revertedWith("Not yet unlocked");
    });

    it("Should charge fee for early withdrawal", async function () {
      // Try early withdrawal
      await expect(erc20Account.connect(user1).withdrawBeforeUnlockTime())
        .to.emit(erc20Account, "Withdraw")
        .to.emit(erc20Account, "Credit3PercentWithdrawal");
      
      // Check that 3% fee was charged
      const factoryBalance = await pigiVestToken.balanceOf(await owner.getAddress());
      expect(factoryBalance).to.be.gt(0);
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

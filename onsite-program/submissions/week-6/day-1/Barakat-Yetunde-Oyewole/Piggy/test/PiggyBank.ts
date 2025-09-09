import { expect } from "chai";
import { ethers } from "hardhat";
import { PiggyBankFactory, PiggyBank, MockERC20 } from "../typechain-types";
import { Signer } from "ethers";

describe("PiggyBank Factory System", function () {
  let factory: PiggyBankFactory;
  let piggyBank: PiggyBank;
  let mockToken: MockERC20;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let admin: Signer;

  const ONE_DAY = 24 * 60 * 60;
  const ONE_MONTH = 30 * ONE_DAY;
  const ONE_ETHER = ethers.parseEther("1");
  const ADDRESS_ZERO = ethers.ZeroAddress;

  beforeEach(async function () {
    [admin, owner, user1, user2] = await ethers.getSigners();

    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    factory = (await PiggyBankFactory.connect(admin).deploy()) as PiggyBankFactory;
    await factory.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = (await MockERC20.deploy("Test Token", "TEST", 18)) as MockERC20;
    await mockToken.waitForDeployment();

    await mockToken.mint(await owner.getAddress(), ethers.parseEther("1000"));
    await mockToken.mint(await user1.getAddress(), ethers.parseEther("1000"));
  });

  describe("Factory Deployment", function () {
    it("Should set correct admin", async function () {
      expect(await factory.admin()).to.equal(await admin.getAddress());
    });

    it("Should have zero piggy banks initially", async function () {
      const stats = await factory.getFactoryStats();
      expect(stats.totalBanks).to.equal(0n);
    });
  });

  describe("Piggy Bank Creation", function () {
    it("Should create piggy bank for user", async function () {
      await factory.connect(owner).createPiggyBank();
      const piggyBankAddr = await factory.getUserPiggyBank(await owner.getAddress());
      expect(piggyBankAddr).to.not.equal(ADDRESS_ZERO);
      expect(await factory.userHasPiggyBank(await owner.getAddress())).to.be.true;
    });

    it("Should prevent duplicate piggy bank creation", async function () {
      await factory.connect(owner).createPiggyBank();
      await expect(factory.connect(owner).createPiggyBank()).to.be.revertedWith(
        "User already has a piggy bank"
      );
    });

    it("Should emit PiggyBankCreated event", async function () {
      const tx = await factory.connect(owner).createPiggyBank();
      const piggyBankAddr = await factory.getUserPiggyBank(await owner.getAddress());
      await expect(tx)
        .to.emit(factory, "PiggyBankCreated")
        .withArgs(await owner.getAddress(), piggyBankAddr);
    });
  });

  describe("Savings Plans - ETH", function () {
    beforeEach(async function () {
      await factory.connect(owner).createPiggyBank();
      const piggyBankAddr = await factory.getUserPiggyBank(await owner.getAddress());
      piggyBank = (await ethers.getContractAt("PiggyBank", piggyBankAddr)) as PiggyBank;
    });

    it("Should create ETH savings plan", async function () {
      await piggyBank.connect(owner).createSavingsPlan(
        ADDRESS_ZERO,
        ONE_ETHER,
        ONE_MONTH,
        "My First Savings",
        { value: ONE_ETHER }
      );

      const plan = await piggyBank.getSavingsPlan(1);
      expect(plan.token).to.equal(ADDRESS_ZERO);
      expect(plan.amount).to.equal(ONE_ETHER);
      expect(plan.lockPeriod).to.equal(ONE_MONTH);
      expect(plan.isActive).to.be.true;
      expect(plan.planName).to.equal("My First Savings");
    });

    it("Should update user savings count", async function () {
      await piggyBank.connect(owner).createSavingsPlan(
        ADDRESS_ZERO,
        ONE_ETHER,
        ONE_MONTH,
        "My First Savings",
        { value: ONE_ETHER }
      );
      expect(await factory.getUserSavingsCount(await owner.getAddress())).to.equal(1n);
    });

    it("Should track contract balance", async function () {
      await piggyBank.connect(owner).createSavingsPlan(
        ADDRESS_ZERO,
        ONE_ETHER,
        ONE_MONTH,
        "My First Savings",
        { value: ONE_ETHER }
      );
      expect(await factory.getUserBalance(await owner.getAddress(), ADDRESS_ZERO)).to.equal(
        ONE_ETHER
      );
    });
  });

  describe("Savings Plans - ERC20", function () {
    beforeEach(async function () {
      await factory.connect(owner).createPiggyBank();
      const piggyBankAddr = await factory.getUserPiggyBank(await owner.getAddress());
      piggyBank = (await ethers.getContractAt("PiggyBank", piggyBankAddr)) as PiggyBank;
    });

    it("Should create ERC20 savings plan", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(owner).approve(piggyBank.getAddress(), amount);
      await piggyBank.connect(owner).createSavingsPlan(
        mockToken.getAddress(),
        amount,
        ONE_MONTH,
        "Token Savings"
      );

      const plan = await piggyBank.getSavingsPlan(1);
      expect(plan.token).to.equal(await mockToken.getAddress());
      expect(plan.amount).to.equal(amount);
    });
  });
});
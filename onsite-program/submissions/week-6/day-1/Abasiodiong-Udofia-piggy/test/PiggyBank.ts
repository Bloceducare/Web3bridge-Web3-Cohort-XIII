import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";

describe("PiggyBankFactory", function () {
  async function deployPiggyBankFactoryFixture() {
    const [admin, user, otherUser] = await hre.ethers.getSigners();
    const PiggyBankFactory = await hre.ethers.getContractFactory("PiggyBankFactory");
    const factory = await PiggyBankFactory.deploy();
    await factory.waitForDeployment();

    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.waitForDeployment();

    return { factory, admin, user, otherUser, mockERC20 };
  }

  async function createEtherPiggyBankFixture() {
    const { factory, admin, user, otherUser, mockERC20 } = await loadFixture(deployPiggyBankFactoryFixture);
    const duration = 3600; // 1 hour
    const tx = await factory.connect(user).createPiggyBank(duration, ethers.ZeroAddress);
    const receipt = await tx.wait();
    const piggyBankAddress = receipt?.logs[1].args.piggyBank;
    const piggyBank = await hre.ethers.getContractAt("IPiggyBank", piggyBankAddress);

    return { factory, piggyBank, admin, user, otherUser, mockERC20, duration };
  }

  async function createERC20PiggyBankFixture() {
    const { factory, admin, user, otherUser, mockERC20 } = await loadFixture(deployPiggyBankFactoryFixture);
    const duration = 3600;
    const tx = await factory.connect(user).createPiggyBank(duration, await mockERC20.getAddress());
    const receipt = await tx.wait();
    const piggyBankAddress = receipt?.logs[1].args.piggyBank;
    const piggyBank = await hre.ethers.getContractAt("IPiggyBank", piggyBankAddress);

    return { factory, piggyBank, admin, user, otherUser, mockERC20, duration };
  }

  describe("Deployment", function () {
    it("Should set the admin correctly", async function () {
      const { factory, admin } = await loadFixture(deployPiggyBankFactoryFixture);
      expect(await factory.admin()).to.equal(admin.address);
    });

    it("Should deploy correctly via Hardhat Ignition", async function () {
      const { factory, mockERC20 } = await loadFixture(deployPiggyBankFactoryFixture);
      const PiggyBankModule = await import("../ignition/modules/PiggyBank");
      const { factory: ignitionFactory, mockERC20: ignitionMockERC20 } = await hre.ignition.deploy(PiggyBankModule, {
        defaultSender: (await hre.ethers.getSigners())[0].address,
      });

      expect(await ignitionFactory.admin()).to.equal(await factory.admin());
      expect(await ignitionMockERC20.name()).to.equal(await mockERC20.name());
      expect(await ignitionMockERC20.symbol()).to.equal(await mockERC20.symbol());
    });
  });

  describe("PiggyBank Creation", function () {
    it("Should create a piggy bank for Ether", async function () {
      const { factory, user } = await loadFixture(deployPiggyBankFactoryFixture);
      const duration = 3600;

      await expect(factory.connect(user).createPiggyBank(duration, ethers.ZeroAddress))
        .to.emit(factory, "PiggyBankCreated")
        .withArgs(user.address, anyValue, (await hre.ethers.provider.getBlock("latest")).timestamp + duration, ethers.ZeroAddress);

      const userPiggyBanks = await factory.getUserPiggyBanksInfo(user.address);
      expect(userPiggyBanks.length).to.equal(1);
      expect(userPiggyBanks[0].asset).to.equal(ethers.ZeroAddress);
      expect(userPiggyBanks[0].balance).to.equal(0);
      expect(userPiggyBanks[0].unlockTime).to.be.closeTo(
        (await hre.ethers.provider.getBlock("latest")).timestamp + duration,
        5
      );
    });

    it("Should create a piggy bank for ERC20", async function () {
      const { factory, user, mockERC20 } = await loadFixture(deployPiggyBankFactoryFixture);
      const duration = 3600;

      await expect(factory.connect(user).createPiggyBank(duration, await mockERC20.getAddress()))
        .to.emit(factory, "PiggyBankCreated")
        .withArgs(user.address, anyValue, anyValue, await mockERC20.getAddress());

      const userPiggyBanks = await factory.getUserPiggyBanksInfo(user.address);
      expect(userPiggyBanks.length).to.equal(1);
      expect(userPiggyBanks[0].asset).to.equal(await mockERC20.getAddress());
      expect(userPiggyBanks[0].balance).to.equal(0);
    });

    it("Should track multiple piggy banks with different lock periods", async function () {
      const { factory, user } = await loadFixture(deployPiggyBankFactoryFixture);
      await factory.connect(user).createPiggyBank(3600, ethers.ZeroAddress);
      await factory.connect(user).createPiggyBank(7200, ethers.ZeroAddress);

      const userPiggyBanks = await factory.getUserPiggyBanksInfo(user.address);
      expect(await factory.getUserSavingsCount(user.address)).to.equal(2);
      expect(userPiggyBanks[0].unlockTime).to.be.closeTo(
        (await hre.ethers.provider.getBlock("latest")).timestamp + 3600,
        5
      );
      expect(userPiggyBanks[1].unlockTime).to.be.closeTo(
        (await hre.ethers.provider.getBlock("latest")).timestamp + 7200,
        5
      );
    });

    it("Should revert if duration is zero", async function () {
      const { factory, user } = await loadFixture(deployPiggyBankFactoryFixture);
      await expect(factory.connect(user).createPiggyBank(0, ethers.ZeroAddress))
        .to.be.revertedWithCustomError(factory, "ZeroDuration");
    });
  });

  describe("Deposits and Withdrawals", function () {
    it("Should deposit and withdraw Ether after lock period", async function () {
      const { piggyBank, user, duration } = await loadFixture(createEtherPiggyBankFixture);
      const depositAmount = hre.ethers.utils.parseEther("1.0");

      await expect(user.sendTransaction({ to: piggyBank.address, value: depositAmount }))
        .to.emit(piggyBank, "Deposited")
        .withArgs(user.address, depositAmount);
      expect(await piggyBank.getBalance()).to.equal(depositAmount);

      await hre.network.provider.send("evm_increaseTime", [duration + 1]);
      await hre.network.provider.send("evm_mine");

      const initialBalance = await user.getBalance();
      const withdrawTx = await piggyBank.connect(user).withdraw(depositAmount);
      const withdrawReceipt = await withdrawTx.wait();
      const gasUsed = withdrawReceipt.gasUsed.mul(withdrawReceipt.effectiveGasPrice);

      expect(await piggyBank.getBalance()).to.equal(0);
      expect(await user.getBalance()).to.be.closeTo(
        initialBalance.add(depositAmount).sub(gasUsed),
        hre.ethers.utils.parseEther("0.01")
      );
    });

    it("Should deposit and withdraw ERC20 after lock period", async function () {
      const { piggyBank, user, mockERC20, duration } = await loadFixture(createERC20PiggyBankFixture);
      const depositAmount = hre.ethers.utils.parseEther("100");

      await mockERC20.transfer(user.address, depositAmount);

      await mockERC20.connect(user).approve(piggyBank.address, depositAmount);
      await expect(piggyBank.connect(user).deposit(depositAmount))
        .to.emit(piggyBank, "Deposited")
        .withArgs(user.address, depositAmount);
      expect(await piggyBank.getBalance()).to.equal(depositAmount);

      await hre.network.provider.send("evm_increaseTime", [duration + 1]);
      await hre.network.provider.send("evm_mine");

      await piggyBank.connect(user).withdraw(depositAmount);

      expect(await piggyBank.getBalance()).to.equal(0);
      expect(await mockERC20.balanceOf(user.address)).to.equal(depositAmount);
    });

    it("Should charge 3% fee for early withdrawal (Ether)", async function () {
      const { factory, piggyBank, user, admin } = await loadFixture(createEtherPiggyBankFixture);
      const depositAmount = hre.ethers.utils.parseEther("1.0");
      const expectedFee = depositAmount.mul(3).div(100);
      const expectedToUser = depositAmount.sub(expectedFee);

      await user.sendTransaction({ to: piggyBank.address, value: depositAmount });

      const initialAdminBalance = await admin.getBalance();
      await expect(piggyBank.connect(user).withdraw(depositAmount))
        .to.emit(piggyBank, "Withdrawn")
        .withArgs(user.address, expectedToUser, expectedFee);

      expect(await piggyBank.getBalance()).to.equal(0);
      expect(await admin.getBalance()).to.equal(initialAdminBalance.add(expectedFee));
    });

    it("Should charge 3% fee for early withdrawal (ERC20)", async function () {
      const { piggyBank, user, admin, mockERC20 } = await loadFixture(createERC20PiggyBankFixture);
      const depositAmount = hre.ethers.utils.parseEther("100");
      const expectedFee = depositAmount.mul(3).div(100);
      const expectedToUser = depositAmount.sub(expectedFee);

      await mockERC20.transfer(user.address, depositAmount);

      await mockERC20.connect(user).approve(piggyBank.address, depositAmount);
      await piggyBank.connect(user).deposit(depositAmount);

      const initialAdminBalance = await mockERC20.balanceOf(admin.address);
      await expect(piggyBank.connect(user).withdraw(depositAmount))
        .to.emit(piggyBank, "Withdrawn")
        .withArgs(user.address, expectedToUser, expectedFee);

      expect(await piggyBank.getBalance()).to.equal(0);
      expect(await mockERC20.balanceOf(admin.address)).to.equal(initialAdminBalance.add(expectedFee));
      expect(await mockERC20.balanceOf(user.address)).to.equal(expectedToUser);
    });

    it("Should revert if withdraw amount exceeds balance", async function () {
      const { piggyBank, user } = await loadFixture(createEtherPiggyBankFixture);
      await expect(piggyBank.connect(user).withdraw(1))
        .to.be.revertedWithCustomError(piggyBank, "InsufficientBalance");
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      const { piggyBank, otherUser } = await loadFixture(createEtherPiggyBankFixture);
      await expect(piggyBank.connect(otherUser).withdraw(1))
        .to.be.revertedWithCustomError(piggyBank, "OnlyOwner");
    });

    it("Should revert if deposit amount is zero", async function () {
      const { piggyBank, user } = await loadFixture(createEtherPiggyBankFixture);
      await expect(piggyBank.connect(user).deposit(0))
        .to.be.revertedWithCustomError(piggyBank, "ZeroAmount");
    });

    it("Should revert if incorrect Ether value is sent", async function () {
      const { piggyBank, user } = await loadFixture(createEtherPiggyBankFixture);
      await expect(piggyBank.connect(user).deposit(1, { value: 2 }))
        .to.be.revertedWithCustomError(piggyBank, "IncorrectEtherValue");
    });

    it("Should revert if Ether is sent for ERC20 deposit", async function () {
      const { piggyBank, user } = await loadFixture(createERC20PiggyBankFixture);
      await expect(piggyBank.connect(user).deposit(1, { value: 1 }))
        .to.be.revertedWithCustomError(piggyBank, "EtherSentForERC20");
    });
  });

  describe("Queries", function () {
    it("Should return user piggy banks info", async function () {
      const { factory, user } = await loadFixture(deployPiggyBankFactoryFixture);
      await factory.connect(user).createPiggyBank(3600, ethers.ZeroAddress);

      const infos = await factory.getUserPiggyBanksInfo(user.address);
      expect(infos.length).to.equal(1);
      expect(infos[0].asset).to.equal(ethers.ZeroAddress);
      expect(infos[0].balance).to.equal(0);
    });
  });

  describe("Interface Compliance", function () {
    it("Should correctly expose IPiggyBank interface functions", async function () {
      const { piggyBank, user, admin } = await loadFixture(createEtherPiggyBankFixture);
      expect(await piggyBank.owner()).to.equal(user.address);
      expect(await piggyBank.admin()).to.equal(admin.address);
      expect(await piggyBank.asset()).to.equal(ethers.ZeroAddress);
      expect(await piggyBank.unlockTime()).to.be.closeTo(
        (await hre.ethers.provider.getBlock("latest")).timestamp + 3600,
        5
      );
      expect(await piggyBank.getBalance()).to.equal(0);
    });
  });
});
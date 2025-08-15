import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("PiggyBankFactory", function () {

  async function deployFixture() {
    const [admin, user1, user2] = await ethers.getSigners();

    // Deploy mock token
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy("MockToken", "MTK", ethers.parseEther("1000000"));
    await token.waitForDeployment();

    // Deploy factory
    const Factory = await ethers.getContractFactory("PiggyBankFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();

    return { admin, user1, user2, token, factory };
  }

  describe("Deployment", function () {
    it("Sets deployer as admin", async function () {
      const { admin, factory } = await loadFixture(deployFixture);
      expect(await factory.admin()).to.equal(admin.address);
    });
  });

  describe("Account creation", function () {
    it("Creates ETH account", async function () {
      const { user1, factory } = await loadFixture(deployFixture);
      await factory.connect(user1).createAccount("ETH Save", ethers.ZeroAddress);

      const accounts = await factory.getUserAccounts(user1.address);
      expect(accounts.length).to.equal(1);
    });

    it("Creates ERC20 account", async function () {
      const { user1, factory, token } = await loadFixture(deployFixture);
      await factory.connect(user1).createAccount("Token Save", token.target);

      const accounts = await factory.getUserAccounts(user1.address);
      expect(accounts.length).to.equal(1);
    });
  });

  describe("Deposits & Withdrawals", function () {
    it("Deposits ETH", async function () {
      const { user1, factory } = await loadFixture(deployFixture);
      await factory.connect(user1).createAccount("ETH Save", ethers.ZeroAddress);
      const accounts = await factory.getUserAccounts(user1.address);

      const piggy = await ethers.getContractAt("PiggyBank", accounts[0]);
      await piggy.connect(user1).depositAndLock(ethers.parseEther("1"), 60 * 60 * 24 * 30, { value: ethers.parseEther("1") });

      expect(await piggy.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("Deposits ERC20", async function () {
      const { user1, factory, token } = await loadFixture(deployFixture);
      await factory.connect(user1).createAccount("Token Save", token.target);
      const accounts = await factory.getUserAccounts(user1.address);

      const piggy = await ethers.getContractAt("PiggyBank", accounts[0]);
      await token.connect(user1).approve(piggy.target, ethers.parseEther("50"));
      await piggy.connect(user1).depositAndLock(ethers.parseEther("50"), 60 * 60 * 24 * 30, { value: ethers.parseEther("50") });

      expect(await piggy.getBalance()).to.equal(ethers.parseEther("50"));
    });

    it("Charges 3% fee for early ETH withdrawal", async function () {
      const { admin, user1, factory } = await loadFixture(deployFixture);
      await factory.connect(user1).createAccount("ETH Fee", ethers.ZeroAddress);
      const accounts = await factory.getUserAccounts(user1.address);

      const piggy = await ethers.getContractAt("PiggyBank", accounts[0]);
      await piggy.connect(user1).depositAndLock(ethers.parseEther("1"), 60 * 60 * 24 * 30, { value: ethers.parseEther("1") });

      const before = await ethers.provider.getBalance(admin.address);
      await piggy.connect(user1).withdraw();
      const after = await ethers.provider.getBalance(admin.address);

      const expectedFee = ethers.parseEther("0.3");
      expect(after - before).to.be.closeTo(expectedFee, ethers.parseEther("0.001"));
    });

    it("Charges 3% fee for early ERC20 withdrawal", async function () {
      const { admin, user1, factory, token } = await loadFixture(deployFixture);
      await factory.connect(user1).createAccount("Token Fee", token.target);
      const accounts = await factory.getUserAccounts(user1.address);

      const piggy = await ethers.getContractAt("PiggyBank", accounts[0]);
      await token.connect(user1).approve(piggy.target, ethers.parseEther("100"));
      await piggy.connect(user1).depositAndLock(ethers.parseEther("100"), 60 * 60 * 24 * 30, { value: ethers.parseEther("100") });
      const before = await token.balanceOf(admin.address);
      await piggy.connect(user1).withdraw();
      const after = await token.balanceOf(admin.address);

      expect(after - before).to.equal(ethers.parseEther("3"));
    });
  });
});

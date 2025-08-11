import { expect } from "chai";
import { ethers } from "hardhat";

describe("PiggyBank", function () {
  async function deployPiggyBankFixture() {
    const [owner, admin, user, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20Mock");
    const token = await Token.deploy("Test Token", "TTK", owner.address, ethers.parseEther("1000"));
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    const ethPiggy = await PiggyBank.deploy(owner.address, admin.address, 60 * 60 * 24, ethers.ZeroAddress);
    const tokenPiggy = await PiggyBank.deploy(owner.address, admin.address, 60 * 60 * 24, token.target);

    return { owner, admin, user, token, ethPiggy, tokenPiggy };
  }

  describe("Ether savings", function () {
    it("should deposit and withdraw ETH without fee after lock period", async function () {
      const { owner, ethPiggy } = await deployPiggyBankFixture();
      await ethPiggy.connect(owner).depositEther({ value: ethers.parseEther("1") });
      expect(await ethPiggy.getBalance()).to.equal(ethers.parseEther("1"));
      await ethers.provider.send("evm_increaseTime", [60 * 60 * 24 + 1]);
      await ethers.provider.send("evm_mine");

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await ethPiggy.connect(owner).withdraw();
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });

    it("should charge 3% fee for early withdrawal", async function () {
      const { owner, admin, ethPiggy } = await deployPiggyBankFixture();

      await ethPiggy.connect(owner).depositEther({ value: ethers.parseEther("1") });

      const adminBalanceBefore = await ethers.provider.getBalance(admin.address);
      await ethPiggy.connect(owner).withdraw();
      const adminBalanceAfter = await ethers.provider.getBalance(admin.address);
      expect(adminBalanceAfter - adminBalanceBefore).to.equal(ethers.parseEther("0.03"));
    });
  });

  describe("ERC20 savings", function () {
    it("should deposit and withdraw ERC20 tokens without fee after lock period", async function () {
      const { owner, token, tokenPiggy } = await deployPiggyBankFixture();

      await token.connect(owner).approve(tokenPiggy.target, ethers.parseEther("100"));
      await tokenPiggy.connect(owner).depositToken(token.target, ethers.parseEther("50"));

      expect(await tokenPiggy.getBalance()).to.equal(ethers.parseEther("50"));

      await ethers.provider.send("evm_increaseTime", [60 * 60 * 24 + 1]);
      await ethers.provider.send("evm_mine");

      await tokenPiggy.connect(owner).withdraw();
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
    });

    it("should charge 3% fee for early ERC20 withdrawal", async function () {
      const { owner, admin, token, tokenPiggy } = await deployPiggyBankFixture();
      await token.connect(owner).approve(tokenPiggy.target, ethers.parseEther("100"));
      await tokenPiggy.connect(owner).depositToken(token.target, ethers.parseEther("50"));
      await tokenPiggy.connect(owner).withdraw();
      expect(await token.balanceOf(admin.address)).to.equal(ethers.parseEther("1.5"));
    });
  });
});


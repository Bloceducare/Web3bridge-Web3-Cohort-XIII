const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MajorToken", function () {
  async function deployTokenFixture() {
    const initialSupply = 1000000; // 1M tokens, NOT in wei
    const [owner, addr1, addr2] = await ethers.getSigners();

    const MajorToken = await ethers.getContractFactory("MajorToken");
    const token = await MajorToken.deploy(initialSupply);
    await token.waitForDeployment();

    return { token, initialSupply, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name, symbol, and decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("Major");
      expect(await token.symbol()).to.equal("MJR");
      expect(await token.decimals()).to.equal(18);
    });

    it("Should assign the total supply to the owner", async function () {
      const { token, initialSupply, owner } = await loadFixture(deployTokenFixture);
      const expectedSupply = ethers.parseEther(initialSupply.toString());
      expect(await token.balanceOf(owner.address)).to.equal(expectedSupply);
      expect(await token.totalSupply()).to.equal(expectedSupply);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens correctly", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("1000");
      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail to transfer to zero address", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("1000");
      await expect(token.transfer(ethers.ZeroAddress, amount)).to.be.revertedWith(
        "ERC20: transfer to zero address"
      );
    });

    it("Should fail to transfer if insufficient balance", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("2000000"); // More than total supply
      await expect(token.connect(addr1).transfer(addr1.address, amount)).to.be.reverted;
    });
  });

  describe("Allowances", function () {
    it("Should approve and transferFrom correctly", async function () {
      const { token, owner, addr1, addr2, initialSupply } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("1000");
      await token.approve(addr1.address, amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);

      await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther((initialSupply - 1000).toString()));
    });

    it("Should fail to approve zero address", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("1000");
      await expect(token.approve(ethers.ZeroAddress, amount)).to.be.revertedWith(
        "ERC20: approve to zero address"
      );
    });

    it("Should fail to transferFrom if insufficient allowance", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("1000");
      await expect(
        token.connect(addr1).transferFrom(addr2.address, addr1.address, amount)
      ).to.be.reverted;
    });
  });

  describe("SafeMath", function () {
    it("Should prevent subtraction overflow", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("1000");
      await expect(token.connect(addr1).transfer(addr1.address, amount)).to.be.reverted;
    });
  });
});
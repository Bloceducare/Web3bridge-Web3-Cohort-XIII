import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MyToken Deployment", function () {
  async function deployToken() {
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("MyToken");
    const initialSupply = hre.ethers.parseEther("1000"); 
    const token = await Token.deploy("MyToken", "MTK", initialSupply);

    return { token, owner, addr1, addr2, initialSupply };
  }

  describe("Deployment", function () {
    it("Should set the correct token info and initial supply", async function () {
      const { token, owner, initialSupply } = await loadFixture(deployToken);

      const tokenInfo = await token.tokenInfo();
      expect(tokenInfo.name).to.equal("MyToken");
      expect(tokenInfo.symbol).to.equal("MTK");
      expect(tokenInfo.decimals).to.equal(18);

      expect(await token.totalSupply()).to.equal(initialSupply);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens correctly", async function () {
      const { token, owner, addr1 } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("100");

      await token.transfer(addr1.address, transferAmount);

      expect(await token.balanceOf(owner.address)).to.equal(hre.ethers.parseEther("900"));
      expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail to transfer with insufficient balance", async function () {
      const { token, addr1 } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("1001");

      await expect(token.connect(addr1).transfer(addr1.address, transferAmount)).to.be.revertedWith(
        "Insufficient balance"
      );
    });

    it("Should fail to transfer to zero address", async function () {
      const { token, owner } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("100");

      await expect(token.transfer(hre.ethers.ZeroAddress, transferAmount)).to.be.revertedWith(
        "Zero address"
      );
    });
  });

  describe("Allowance and TransferFrom", function () {
    it("Should approve and transferFrom correctly", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployToken);
      const allowanceAmount = hre.ethers.parseEther("100");

      await token.approve(addr1.address, allowanceAmount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(allowanceAmount);

      await token.connect(addr1).transferFrom(owner.address, addr2.address, allowanceAmount);

      expect(await token.balanceOf(owner.address)).to.equal(hre.ethers.parseEther("900"));
      expect(await token.balanceOf(addr2.address)).to.equal(allowanceAmount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should fail transferFrom with insufficient allowance", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployToken);
      const allowanceAmount = hre.ethers.parseEther("50");
      const transferAmount = hre.ethers.parseEther("100");

      await token.approve(addr1.address, allowanceAmount);

      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should fail transferFrom with zero address", async function () {
      const { token, addr1 } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("100");

      await expect(
        token.connect(addr1).transferFrom(hre.ethers.ZeroAddress, addr1.address, transferAmount)
      ).to.be.revertedWith("Zero address");
    });
  });

  describe("Library Functions", function () {
    it("Should handle addition and subtraction correctly", async function () {
      const { token, owner, addr1 } = await loadFixture(deployToken);
      const amount1 = hre.ethers.parseEther("500");
      const amount2 = hre.ethers.parseEther("400");

      await token.transfer(addr1.address, amount1);
      expect(await token.balanceOf(addr1.address)).to.equal(amount1);

      await token.connect(addr1).transfer(owner.address, amount2);
      expect(await token.balanceOf(addr1.address)).to.equal(hre.ethers.parseEther("100"));
    });

    it("Should fail on subtraction underflow", async function () {
      const { token, addr1 } = await loadFixture(deployToken);
      const transferAmount = hre.ethers.parseEther("1");

      await expect(token.connect(addr1).transfer(addr1.address, transferAmount)).to.be.revertedWith(
        "Insufficient balance"
      );
    });
  });
});
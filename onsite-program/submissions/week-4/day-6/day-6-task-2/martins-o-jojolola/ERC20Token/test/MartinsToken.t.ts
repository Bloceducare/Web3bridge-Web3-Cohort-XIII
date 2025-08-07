import { Contract, Signer } from "ethers";

import { expect } from "chai";
import { ethers } from "hardhat";



describe("MartinsToken", function () {
  let token: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addrs: Signer[];

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    token = await ethers.deployContract("MartinsToken", ["MartinsToken", "MTK", 18, ethers.parseEther("1000000")]);

  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await token.name()).to.equal("MartinsToken");
      expect(await token.symbol()).to.equal("MTK");
    });

    it("Should set the right decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await token.balanceOf(await owner.getAddress());
      expect(ownerBalance).to.equal(ethers.parseEther("1000000"));
    });

    it("Should have the correct total supply", async function () {
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();

      await token.transfer(addr1Address, ethers.parseEther("100"));
      const addr1Balance = await token.balanceOf(addr1Address);
      expect(addr1Balance).to.equal(ethers.parseEther("100"));

      const ownerBalance = await token.balanceOf(ownerAddress);
      expect(ownerBalance).to.equal(ethers.parseEther("999900"));
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const addr1Address = await addr1.getAddress();
      const initialBalance = await token.balanceOf(addr1Address);

      await expect(token.connect(addr1).transfer(owner.getAddress(), ethers.parseEther("1")))
        .to.be.revertedWithCustomError(token, "InsufficientBalance")
        .withArgs(initialBalance, ethers.parseEther("1"));

      // Ensure balance remains unchanged
      const finalBalance = await token.balanceOf(addr1Address);
      expect(finalBalance).to.equal(initialBalance);
    });

    it("Should update balances after transfers", async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();

      await token.transfer(addr1Address, ethers.parseEther("100"));
      await token.connect(addr1).transfer(addr2Address, ethers.parseEther("50"));

      const addr1Balance = await token.balanceOf(addr1Address);
      expect(addr1Balance).to.equal(ethers.parseEther("50"));

      const addr2Balance = await token.balanceOf(addr2Address);
      expect(addr2Balance).to.equal(ethers.parseEther("50"));
    });

    it("Should emit Transfer events on transfers", async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();

      await expect(token.transfer(addr1Address, ethers.parseEther("100")))
        .to.emit(token, "Transfer")
        .withArgs(await owner.getAddress(), addr1Address, ethers.parseEther("100"));

      await expect(token.connect(addr1).transfer(addr2Address, ethers.parseEther("50")))
        .to.emit(token, "Transfer")
        .withArgs(addr1Address, addr2Address, ethers.parseEther("50"));
    });

    it("Should allow approving and transferring tokens on behalf", async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();

      await token.approve(addr1Address, ethers.parseEther("100"));
      const allowance = await token.allowance(await owner.getAddress(), addr1Address);
      expect(allowance).to.equal(ethers.parseEther("100"));

      await token.connect(addr1).transferFrom(await owner.getAddress(), addr2Address, ethers.parseEther("50"));

      const addr2Balance = await token.balanceOf(addr2Address);
      expect(addr2Balance).to.equal(ethers.parseEther("50"));

      const ownerBalance = await token.balanceOf(await owner.getAddress());
      expect(ownerBalance).to.equal(ethers.parseEther("999950"));
    });

    it("Should fail if transferFrom exceeds allowance", async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();

      await token.approve(addr1Address, ethers.parseEther("50"));

      // Ensure balances remain unchanged
      const addr2Balance = await token.balanceOf(addr2Address);
      expect(addr2Balance).to.equal(0);
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      const addr1Address = await addr1.getAddress();
      await token.transferOwnership(addr1Address);
      expect(await token.owner()).to.equal(addr1Address);
    });

    it("Should fail if non-owner tries to transfer ownership", async function () {
      await expect(token.connect(addr1).transferOwnership(await addr2.getAddress()))
        .to.be.revertedWithCustomError(token, "Unauthorized");
    });

    it("Should emit OwnershipTransferred event on ownership transfer", async function () {
      const addr1Address = await addr1.getAddress();
      await expect(token.transferOwnership(addr1Address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(await owner.getAddress(), addr1Address);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const addr1Address = await addr1.getAddress();
      await token.mint(addr1Address, ethers.parseEther("100"));
      const addr1Balance = await token.balanceOf(addr1Address);
      expect(addr1Balance).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if non-owner tries to mint tokens", async function () {
      await expect(token.connect(addr1).mint(await addr2.getAddress(), ethers.parseEther("100")))
        .to.be.revertedWithCustomError(token, "Unauthorized");
    });

  });

  describe("Owner functions", function () {
    it("Should allow owner to toggle transfers", async function () {
      await token.toggleTransfers(false);
      expect(await token.transfersEnabled()).to.equal(false);

      await expect(token.toggleTransfers(false))
        .to.emit(token, "TransfersToggled")
        .withArgs(false);

      await token.toggleTransfers(true);
      expect(await token.transfersEnabled()).to.equal(true);
    });

    it("Should allow owner to set max transfer amount", async function () {
      const newMaxAmount = ethers.parseEther("50000");

      await token.setMaxTransferAmount(newMaxAmount);
      expect(await token.maxTransferAmount()).to.equal(newMaxAmount);

      await expect(token.setMaxTransferAmount(newMaxAmount))
        .to.emit(token, "MaxTransferAmountSet")
        .withArgs(newMaxAmount);
    });

    it("Should fail setting max transfer amount to zero", async function () {
      await expect(
        token.setMaxTransferAmount(0)
      ).to.be.reverted;
    });

    it("Should fail setting max transfer amount greater than total supply", async function () {
      const totalSupply = await token.totalSupply();
      const excessiveAmount = totalSupply + 1n;

      await expect(
        token.setMaxTransferAmount(excessiveAmount)
      ).to.be.reverted;
    });

    it("Should allow owner to transfer ownership", async function () {
      await expect(token.transferOwnership(addr1.address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);

      expect(await token.owner()).to.equal(addr1.address);
    });

    it("Should fail transferring ownership to zero address", async function () {
      await expect(
        token.transferOwnership(ethers.ZeroAddress)
      ).to.be.reverted;
    });

    it("Should fail if non-owner tries to call owner functions", async function () {
      await expect(
        token.connect(addr1).toggleTransfers(false)
      ).to.be.reverted;

      await expect(
        token.connect(addr1).setMaxTransferAmount(ethers.parseEther("1000"))
      ).to.be.reverted;

      await expect(
        token.connect(addr1).transferOwnership(addr2.address)
      ).to.be.reverted;

      await expect(
        token.connect(addr1).mint(addr2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });
});
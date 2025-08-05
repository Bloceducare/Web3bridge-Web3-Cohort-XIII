import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ERC20, ERC20__factory } from "../typechain-types";

describe("ERC20 Contract", function () {
  let ERC20: ERC20__factory;
  let erc20: ERC20;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const name = "Akanimoh Nigeria";
  const symbol = "AKN";
  const decimals = 18;
  const initialSupply = ethers.parseUnits("1000000", decimals);
  const zeroAddress = ethers.ZeroAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ERC20 = await ethers.getContractFactory("ERC20");
    erc20 = await ERC20.deploy(name, symbol, decimals, initialSupply);
    await erc20.waitForDeployment();
  });

  describe("Initialization", function () {
    it(" set correct token metadata", async function () {
      expect(await erc20.name()).to.equal(name);
      expect(await erc20.symbol()).to.equal(symbol);
      expect(await erc20.decimals()).to.equal(decimals);
      expect(await erc20.get_total_supply()).to.equal(initialSupply);
      expect(await erc20.owner()).to.equal(owner.address);
    });

    it(" assign initial supply to owner", async function () {
      expect(await erc20.balanceOf(owner.address)).to.equal(initialSupply);
      expect(await erc20.balanceOf(user1.address)).to.equal(0);
    });

    it(" emit Transfer event on deployment", async function () {
      await expect(erc20.deploymentTransaction())
        .to.emit(erc20, "Transfer")
        .withArgs(zeroAddress, owner.address, initialSupply);
    });
  });

  describe("totalSupply and get_total_supply", function () {
    it(" return correct total supply", async function () {
      expect(await erc20.get_total_supply()).to.equal(initialSupply);
      expect(await erc20.totalSupply()).to.equal(initialSupply);
    });
  });

  describe("balanceOf", function () {
    it(" return correct balance for an account", async function () {
      expect(await erc20.balanceOf(owner.address)).to.equal(initialSupply);
      expect(await erc20.balanceOf(user1.address)).to.equal(0);
    });
  });

  describe("transfer", function () {
    it(" transfer tokens successfully", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(owner).transfer(user1.address, amount))
        .to.emit(erc20, "Transfer")
        .withArgs(owner.address, user1.address, amount);
      expect(await erc20.balanceOf(owner.address)).to.equal(initialSupply - amount);
      expect(await erc20.balanceOf(user1.address)).to.equal(amount);
    });

    it(" revert on transfer to zero address", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(owner).transfer(zeroAddress, amount))
        .to.be.revertedWithCustomError(erc20, "ZERO_ADDRESS");
    });

    it(" revert on zero amount transfer", async function () {
      await expect(erc20.connect(owner).transfer(user1.address, 0))
        .to.be.revertedWithCustomError(erc20, "ZERO_AMOUNT");
    });

    it(" revert on insufficient balance", async function () {
      const amount = ethers.parseUnits("1000001", decimals);
      await expect(erc20.connect(owner).transfer(user1.address, amount))
        .to.be.revertedWithCustomError(erc20, "INSUFFICIENT_BALANCE");
    });
  });

  describe("approve", function () {
    it(" approve tokens successfully", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(owner).approve(user1.address, amount))
        .to.emit(erc20, "Approval")
        .withArgs(owner.address, user1.address, amount);
      expect(await erc20.allowance(owner.address, user1.address)).to.equal(amount);
    });

    it(" revert on approve to zero address", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(owner).approve(zeroAddress, amount))
        .to.be.revertedWithCustomError(erc20, "ZERO_ADDRESS");
    });
  });

  describe("transferFrom", function () {
    it(" transfer tokens from approved account", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await erc20.connect(owner).approve(user1.address, amount);
      await expect(erc20.connect(user1).transferFrom(owner.address, user2.address, amount))
        .to.emit(erc20, "Transfer")
        .withArgs(owner.address, user2.address, amount);
      expect(await erc20.balanceOf(owner.address)).to.equal(initialSupply - amount);
      expect(await erc20.balanceOf(user2.address)).to.equal(amount);
    });

    it(" revert on insufficient balance", async function () {
      const amount = initialSupply + BigInt(1);
      await erc20.connect(owner).approve(user1.address, amount);
      await expect(erc20.connect(user1).transferFrom(owner.address, user2.address, amount))
        .to.be.revertedWithCustomError(erc20, "INSUFFICIENT_BALANCE");
    });

    it(" revert on insufficient allowance", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(user1).transferFrom(owner.address, user2.address, amount))
        .to.be.revertedWithCustomError(erc20, "INSUFFICIENT_ALLOWANCE");
    });
  });
  describe("burn", function () {
    it(" burn tokens successfully", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(owner).burn(amount))
        .to.emit(erc20, "Transfer")
        .withArgs(owner.address, zeroAddress, amount);
      expect(await erc20.balanceOf(owner.address)).to.equal(initialSupply - amount);
      expect(await erc20.get_total_supply()).to.equal(initialSupply - amount);
    });

    it(" revert on burn with zero amount", async function () {
      await expect(erc20.connect(owner).burn(0))
        .to.be.revertedWithCustomError(erc20, "ZERO_AMOUNT");
    });

    it(" revert on burn with insufficient balance", async function () {
      const amount = ethers.parseUnits("1000001", decimals);
      await expect(erc20.connect(owner).burn(amount))
        .to.be.revertedWithCustomError(erc20, "INSUFFICIENT_BALANCE");
    });
  });

  describe("mint", function () {
    it(" mint tokens successfully (owner)", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(owner).mint(user1.address, amount))
        .to.emit(erc20, "Transfer")
        .withArgs(zeroAddress, user1.address, amount);
      expect(await erc20.balanceOf(user1.address)).to.equal(amount);
      expect(await erc20.get_total_supply()).to.equal(initialSupply + amount);
    });

    it(" revert on mint by non-owner", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(user1).mint(user2.address, amount))
        .to.be.revertedWithCustomError(erc20, "NOT_OWNER");
    });

    it(" revert on mint to zero address", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await expect(erc20.connect(owner).mint(zeroAddress, amount))
        .to.be.revertedWithCustomError(erc20, "ZERO_ADDRESS");
    });

    it(" revert on mint with zero amount", async function () {
      await expect(erc20.connect(owner).mint(user1.address, 0))
        .to.be.revertedWithCustomError(erc20, "ZERO_AMOUNT");
    });
  });

  describe("allowance", function () {
    it(" return correct allowance", async function () {
      const amount = ethers.parseUnits("1000", decimals);
      await erc20.connect(owner).approve(user1.address, amount);
      expect(await erc20.allowance(owner.address, user1.address)).to.equal(amount);
      expect(await erc20.allowance(owner.address, user2.address)).to.equal(0);
    });
  });
});
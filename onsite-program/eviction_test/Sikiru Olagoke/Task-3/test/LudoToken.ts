import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("LudoToken", function () {
  let ludoToken: LudoToken;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let addrs: HardhatEthersSigner[];

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
    ludoToken = await LudoTokenFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ludoToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await ludoToken.balanceOf(owner.address);
      expect(await ludoToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await ludoToken.name()).to.equal("Ludo Token");
      expect(await ludoToken.symbol()).to.equal("LUDO");
    });

    it("Should have correct initial supply", async function () {
      const expectedSupply = ethers.parseEther("1000000"); // 1 million tokens
      expect(await ludoToken.totalSupply()).to.equal(expectedSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("50");

      await ludoToken.transfer(addr1.address, transferAmount);
      const addr1Balance = await ludoToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      await ludoToken.connect(addr1).transfer(addr2.address, transferAmount);
      const addr2Balance = await ludoToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await ludoToken.balanceOf(owner.address);

      await expect(
        ludoToken.connect(addr1).transfer(owner.address, 1),
      ).to.be.revertedWithCustomError(ludoToken, "ERC20InsufficientBalance");

      expect(await ludoToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance,
      );
    });
  });

  describe("Allowances", function () {
    it("Should approve and transferFrom correctly", async function () {
      const allowanceAmount = ethers.parseEther("100");
      const transferAmount = ethers.parseEther("50");

      await ludoToken.approve(addr1.address, allowanceAmount);

      await ludoToken
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, transferAmount);

      expect(await ludoToken.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await ludoToken.allowance(owner.address, addr1.address)).to.equal(
        allowanceAmount - transferAmount,
      );
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const initialSupply = await ludoToken.totalSupply();

      await ludoToken.mint(addr1.address, mintAmount);

      expect(await ludoToken.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await ludoToken.totalSupply()).to.equal(
        initialSupply + mintAmount,
      );
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");

      await expect(
        ludoToken.connect(addr1).mint(addr2.address, mintAmount),
      ).to.be.revertedWithCustomError(ludoToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      const transferAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("50");

      await ludoToken.transfer(addr1.address, transferAmount);
      const initialBalance = await ludoToken.balanceOf(addr1.address);
      const initialSupply = await ludoToken.totalSupply();

      await ludoToken.connect(addr1).burn(burnAmount);

      expect(await ludoToken.balanceOf(addr1.address)).to.equal(
        initialBalance - burnAmount,
      );
      expect(await ludoToken.totalSupply()).to.equal(
        initialSupply - burnAmount,
      );
    });

    it("Should fail if user tries to burn more tokens than they have", async function () {
      const burnAmount = ethers.parseEther("1");

      await expect(
        ludoToken.connect(addr1).burn(burnAmount),
      ).to.be.revertedWithCustomError(ludoToken, "ERC20InsufficientBalance");
    });
  });

  describe("Token Distribution", function () {
    it("Should distribute tokens to multiple addresses", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];

      await ludoToken.distributeTokens(recipients, amounts);

      expect(await ludoToken.balanceOf(addr1.address)).to.equal(amounts[0]);
      expect(await ludoToken.balanceOf(addr2.address)).to.equal(amounts[1]);
    });

    it("Should fail if arrays length mismatch", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseEther("100")]; // Mismatched length

      await expect(
        ludoToken.distributeTokens(recipients, amounts),
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("Should not allow non-owner to distribute tokens", async function () {
      const recipients = [addr1.address];
      const amounts = [ethers.parseEther("100")];

      await expect(
        ludoToken.connect(addr1).distributeTokens(recipients, amounts),
      ).to.be.revertedWithCustomError(ludoToken, "OwnableUnauthorizedAccount");
    });
  });
});

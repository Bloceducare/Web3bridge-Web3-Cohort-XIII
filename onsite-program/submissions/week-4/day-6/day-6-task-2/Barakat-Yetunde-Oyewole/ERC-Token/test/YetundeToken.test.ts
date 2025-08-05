import { expect } from "chai";
import { ethers } from "hardhat";
import { MyToken } from "../typechain-types";

const TOTAL_SUPPLY = ethers.parseEther("1000000");

describe("YetundeToken (ERC20)", function () {
  let token: MyToken;
  let owner: any;
  let user1: any;
  let user2: any;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    const TokenFactory = await ethers.getContractFactory("MyToken");
    token = await TokenFactory.deploy(
      "Yetunde Token",
      "YET",
      18,
      TOTAL_SUPPLY);
    await token.waitForDeployment();
  });

  describe("Deployment", () => {
    it("Should set correct metadata", async () => {
      expect(await token.name()).to.equal("Yetunde Token");
      expect(await token.symbol()).to.equal("YET");
      expect(await token.decimals()).to.equal(18);
    });


  });

  describe("Transfers", () => {
    it("Should transfer tokens between accounts", async () => {
      const amount = ethers.parseEther("1000");
      await token.transfer(user1Address, amount);
      expect(await token.balanceOf(user1Address)).to.equal(amount);
    });

    it("Should fail if sender has insufficient balance", async () => {
      await expect(
        token.connect(user1).transfer(ownerAddress, 1)
      ).to.be.revertedWith("Transfer amount exceeds balance");
    });

    it("Should reject zero-address transfers", async () => {
      await expect(
        token.transfer(ethers.ZeroAddress, 100)
      ).to.be.revertedWith("Transfer to zero address");
    });
  });

  describe("Allowances", () => {
    it("Should approve spending correctly", async () => {
      const amount = ethers.parseEther("500");
      await token.approve(user1Address, amount);
      expect(await token.allowance(ownerAddress, user1Address)).to.equal(amount);
    });

    it("Should allow transferFrom with allowance", async () => {
      const amount = ethers.parseEther("500");
      await token.approve(user1Address, amount);
      await token.connect(user1).transferFrom(ownerAddress, user2Address, amount);
      expect(await token.balanceOf(user2Address)).to.equal(amount);
    });

    it("Should fail transferFrom with insufficient allowance", async () => {
      await expect(
        token.connect(user1).transferFrom(ownerAddress, user2Address, 1)
      ).to.be.revertedWith("Insufficient allowance");
    });
  });

  describe("Minting", () => {
    it("Should allow owner to mint tokens", async () => {
      const amount = ethers.parseEther("5000");
      await token.mint(user1Address, amount);
      expect(await token.balanceOf(user1Address)).to.equal(amount);
    });

    it("Should prevent non-owners from minting", async () => {
      await expect(
        token.connect(user1).mint(user1Address, 1000)
      ).to.be.revertedWith("Not the owner");
    });
  });

  describe("Burning", () => {
    it("Should allow users to burn their tokens", async () => {
      const amount = ethers.parseEther("1000");
      await token.transfer(user1Address, amount);
      await token.connect(user1).burn(amount);
      expect(await token.balanceOf(user1Address)).to.equal(0);
    });

    it("Should fail if burn amount exceeds balance", async () => {
      await expect(
        token.connect(user1).burn(1)
      ).to.be.revertedWith("Burn amount exceeds balance");
    });
  });

  describe("Ownership", () => {
    it("Should transfer ownership", async () => {
      await token.transferOwnership(user1Address);
      expect(await token.owner()).to.equal(user1Address);
    });

    it("Should prevent non-owners from transferring ownership", async () => {
      await expect(
        token.connect(user1).transferOwnership(user2Address)
      ).to.be.revertedWith("Not the owner");
    });
  });
});
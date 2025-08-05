import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("erc20token", () => {
  async function deployContract() {
    const [owner, otherAccount] = await ethers.getSigners(); 
    const MyContract = await ethers.getContractFactory("erc20token");
    const deployedContract = await MyContract.deploy();
    return { deployedContract, owner, otherAccount };
  }


  // Test totalSupply and mintToken
  describe("Test function _totalSupply and mintToken", () => {
    it("Should return 0 for total supply by default", async () => {
      const { deployedContract: newContract } = await loadFixture(deployContract);
      expect(await newContract._totalSupply()).to.equal(0);
    });

    it("Should update totalSupply when token is minted", async () => {
      const { deployedContract: newContract, owner } = await loadFixture(deployContract);
      await newContract.mintToken(owner.address, 100);
      expect(await newContract._totalSupply()).to.equal(100);
    });

    it("Should revert mintToken if caller is not owner", async () => {
      const { deployedContract: newContract, otherAccount } = await loadFixture(deployContract);
      await expect(
        newContract.connect(otherAccount).mintToken(otherAccount.address, 50)
      ).to.be.revertedWithCustomError(newContract, "ONLY_OWNER_CAN_MINT");
    });
  });


  // Test balanceOf and mintToken
  describe("Test function balanceOf() and mintToken()", () => {
    it("Should return 0 for balanceOf by default", async () => {
      const { deployedContract: newContract, owner } = await loadFixture(deployContract);
      expect(await newContract.balanceOf(owner.address)).to.equal(0);
    });

    it("Should update balanceOf when token is minted", async () => {
      const { deployedContract: newContract, owner } = await loadFixture(deployContract);
      await newContract.mintToken(owner.address, 200);
      expect(await newContract.balanceOf(owner.address)).to.equal(200);
    });
  });


  // Test transfer function
  describe("Transfer function", function () {
    it("Should transfer tokens between accounts", async function () {
      const { deployedContract: newContract, owner, otherAccount } = await loadFixture(deployContract);

      // Mint tokens so owner has balance
      await newContract.mintToken(owner.address, ethers.parseUnits("1000", 18));

      const ownerInitialBalance = await newContract.balanceOf(owner.address);
      const receiverInitialBalance = await newContract.balanceOf(otherAccount.address);

      const transferAmount = ethers.parseUnits("100", 18);
      await newContract.trasfer(otherAccount.address, transferAmount);

      const ownerFinalBalance = await newContract.balanceOf(owner.address);
      const receiverFinalBalance = await newContract.balanceOf(otherAccount.address);

      expect(ownerFinalBalance).to.equal(ownerInitialBalance - transferAmount);
      expect(receiverFinalBalance).to.equal(receiverInitialBalance + transferAmount);
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { deployedContract: newContract, otherAccount } = await loadFixture(deployContract);

      const transferAmount = ethers.parseUnits("50", 18);
      await expect(
        newContract.connect(otherAccount).trasfer(ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWithCustomError(newContract, "INSUFFICIENT_BALANCE");
    });
  });


  // Test approve and allowance
  describe("Test approve() and allowance()", function () {
    it("Should set allowance for spender", async function () {
      const { deployedContract: newContract, owner, otherAccount } = await loadFixture(deployContract);
      await newContract.mintToken(owner.address, ethers.parseUnits("500", 18));

      await newContract.approve(otherAccount.address, ethers.parseUnits("100", 18));
      expect(await newContract.connect(owner).allowance(otherAccount.address))
        .to.equal(ethers.parseUnits("100", 18));
    });

    it("Should return true when approve is called", async function () {
      const { deployedContract: newContract, owner, otherAccount } = await loadFixture(deployContract);
      
      // Wait for transaction to complete and verify allowance was set
      await newContract.approve(otherAccount.address, ethers.parseUnits("50", 18));
      expect(await newContract.connect(owner).allowance(otherAccount.address))
        .to.equal(ethers.parseUnits("50", 18));
    });
  });


  // Test transFrom
  describe("Test transFrom()", function () {
    it("Should transfer tokens using allowance", async function () {
      const { deployedContract: newContract, owner, otherAccount } = await loadFixture(deployContract);

      await newContract.mintToken(owner.address, ethers.parseUnits("500", 18));
      await newContract.approve(otherAccount.address, ethers.parseUnits("100", 18));

      await newContract.connect(otherAccount).transFrom(
        owner.address,
        otherAccount.address,
        ethers.parseUnits("50", 18)
      );

      expect(await newContract.balanceOf(owner.address)).to.equal(ethers.parseUnits("450", 18));
      expect(await newContract.balanceOf(otherAccount.address)).to.equal(ethers.parseUnits("50", 18));
    });

    it("Should revert if transFrom amount exceeds balance", async function () {
      const { deployedContract: newContract, owner, otherAccount } = await loadFixture(deployContract);

      await newContract.approve(otherAccount.address, ethers.parseUnits("100", 18));

      await expect(
        newContract.connect(otherAccount).transFrom(
          owner.address,
          otherAccount.address,
          ethers.parseUnits("50", 18)
        )
      ).to.be.revertedWithCustomError(newContract, "INSUFFICIENT_BALANCE");
    });

    it("Should revert if transFrom amount is greater than allowed amount", async function () {
      const { deployedContract: newContract, owner, otherAccount } = await loadFixture(deployContract);

      await newContract.mintToken(owner.address, ethers.parseUnits("500", 18));
      await newContract.approve(otherAccount.address, ethers.parseUnits("30", 18));

      await expect(
        newContract.connect(otherAccount).transFrom(
          owner.address,
          otherAccount.address,
          ethers.parseUnits("50", 18)
        )
      ).to.be.revertedWithCustomError(newContract, "AMOUNT_LESS_THAN_ALLOWED_AMOUNT");
    });
  });


  // Test contract initialization
  describe("Contract initialization", function () {
    it("Should set correct initial values", async function () {
      const { deployedContract: newContract } = await loadFixture(deployContract);
      
      expect(await newContract._totalSupply()).to.equal(0);
      expect(await newContract.totalSupply()).to.equal(0);
    });
  });
});
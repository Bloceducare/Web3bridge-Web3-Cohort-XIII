import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20", function () {
  async function deployERC20Fixture() {
    const [owner, user1, user2] = await hre.ethers.getSigners();
    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    let ts = hre.ethers.parseEther("1000");

    const erc20 = await ERC20.deploy("Token", "TK", 18, ts);

    expect(await erc20.name()).to.equal("Token");
    expect(await erc20.symbol()).to.equal("TK");
    expect(await erc20.decimal()).to.equal(18);
    expect(await erc20.totalSupply()).to.equal(ts);
    return { erc20, owner, user1, user2 };
  }

  describe("totalsupply", function () {
    it("should get totalsupply", async () => {
      const { erc20 } = await loadFixture(deployERC20Fixture);

      const _totalSupply = hre.ethers.parseEther("1000");

      expect(await erc20.totalSupply()).to.equal(_totalSupply);
    });
  });

  describe("BalanceOf", function () {
    it("should get the balance of user", async function () {
      const { erc20, owner } = await loadFixture(deployERC20Fixture);
      const _balance = hre.ethers.parseEther("1000");
      expect(await erc20.balanceOf(owner)).to.equal(_balance);
    });
  });

  describe("transfer", function () {
    it("should run a transfer", async function () {
      const { erc20, owner, user1 } = await loadFixture(deployERC20Fixture);

      // Owner starts with 1000 tokens from deployment
      expect(await erc20.balanceOf(owner.address)).to.equal(
        hre.ethers.parseEther("1000")
      );

      const _amount = hre.ethers.parseEther("100");
      const initialUser1Balance = await erc20.balanceOf(user1.address);
      const initialOwnerBalance = await erc20.balanceOf(owner.address);

      // Transfer 100 tokens from owner to user1
      await expect(erc20.transfer(user1.address, _amount)).to.emit(
        erc20,
        "Transfer"
      );

      // Check final balances
      expect(await erc20.balanceOf(user1.address)).to.equal(initialUser1Balance + _amount);
      expect(await erc20.balanceOf(owner.address)).to.equal(initialOwnerBalance - _amount);
    });
    it("should check for a zero address", async function(){
      const{erc20} = await loadFixture(deployERC20Fixture);
      const _amount = hre.ethers.parseEther("10");
      await expect(erc20.transfer(hre.ethers.ZeroAddress, _amount)).revertedWith("Invalid address");
    })
  });

  describe("approve", function () {
    it("should approve a transaction", async function () {
      const { erc20, owner, user1 } = await loadFixture(deployERC20Fixture);
      const amount = hre.ethers.parseEther("10");
      await expect(erc20.approve(user1.address, amount)).to.emit(
        erc20,
        "Approval"
      );
      const allowance = await erc20.allowance(owner.address, user1.address);
      expect(allowance).to.equal(amount);
    });
    it("should check for a zero address", async function(){
      const{erc20} = await loadFixture(deployERC20Fixture);
      const _amount = hre.ethers.parseEther("10");
      await expect(erc20.approve(hre.ethers.ZeroAddress, _amount)).revertedWith("Invalid address");
    })
  });

  describe("transferFrom", function () {
    it("should transfer through a third party", async function () {
      const { erc20, owner, user1, user2 } = await loadFixture(deployERC20Fixture);
      const _amount = hre.ethers.parseEther("100");

      // get initial balances
      const initialUser2Balance = await erc20.balanceOf(user2.address);
      const initialOwnerBalance = await erc20.balanceOf(owner.address);

      expect(await erc20.approve(user1.address, _amount)).to.emit(erc20, "Approval");
      await erc20.connect(user1).transferFrom(owner.address, user2.address, _amount);

      // get final balances
      const finalUser2Balance = await erc20.balanceOf(user2.address);
      const finalOwnerBalance = await erc20.balanceOf(owner.address);

      expect(finalUser2Balance).to.equal(initialUser2Balance + _amount);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - _amount);
    })
    it("should check for a zero address", async function(){
      const{erc20} = await loadFixture(deployERC20Fixture);
      const _amount = hre.ethers.parseEther("10");
      await expect(erc20.transferFrom(hre.ethers.ZeroAddress, hre.ethers.ZeroAddress, _amount)).revertedWith("Invalid address");
    })
  })

  describe("Mint", function(){
    it("should mint tokens", async function(){
      const{erc20, owner} = await loadFixture(deployERC20Fixture);
      const _amount = hre.ethers.parseEther("100");
      const initialOwnerBalance = await erc20.balanceOf(owner.address);
      expect(await erc20.mint(owner.address, _amount)).to.emit(erc20,"Transfer");
      expect(await erc20.balanceOf(owner)).to.equal(initialOwnerBalance + _amount);
    })
  })
});

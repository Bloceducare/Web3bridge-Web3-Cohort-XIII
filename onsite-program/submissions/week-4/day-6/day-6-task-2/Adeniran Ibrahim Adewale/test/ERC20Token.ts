import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Token Deployment", function () {
  async function deployToken() {
    const Token = await hre.ethers.getContractFactory("ERC20Token");
    const token = await Token.deploy();
    const [owner, address1, address2] = await hre.ethers.getSigners();

    const value = ethers.parseEther("50");
    return { token, address1, address2, value, owner };
  }

  describe("Initiate Transaction", function () {
    it("Should transfer tokens", async function () {
      const { token, address1, value } = await loadFixture(deployToken);

      await token.transfer(address1, value);

      const balances = await token.balanceOf(address1);

      expect(balances).to.equal(value);
    });

    it("Should approve token transfer", async function () {
      const { token, address1, value, owner } = await loadFixture(deployToken);

      const approve = await token.approve(address1, value);
      await approve.wait();

      const allowance = await token.allowance(owner.address, address1);

      expect(allowance).to.equal(value);
    });

    it("Should allow user to transfer tokens", async function () {
      const { token, address1, address2, value, owner } = await loadFixture(
        deployToken
      );

      await token.connect(address1).approve(owner.address, value);
      await token.transfer(address1.address, ethers.parseEther("1000"));
      const senderBalanceBefore = await token.balanceOf(address1.address);
      const receiveBalanceBefore = await token.balanceOf(address2.address);

      await token.transferFrom(address1, address2, value);
      const balanceFrom = await token.balanceOf(address1);
      const balanceTo = await token.balanceOf(address2);

      expect(balanceFrom).to.equal(senderBalanceBefore - value);
      expect(balanceTo).to.equal(receiveBalanceBefore + value);

      // Also check that allowance was reduced
      const remainingAllowance = await token.allowance(address1, owner.address);
      expect(remainingAllowance).to.equal(0);
    });

    it("Should transfer tokens and get balance correctly", async function () {
      const { token, address1, value } = await loadFixture(deployToken);

      const [owner] = await ethers.getSigners();

      const initialOwnerBalance = await token.balanceOf(owner.address);
      const initialAddress1Balance = await token.balanceOf(address1.address);

      await token.transfer(address1.address, ethers.parseEther("100"));

      const finalOwnerBalance = await token.balanceOf(owner.address);
      const finalAddress1Balance = await token.balanceOf(address1.address);

      expect(finalOwnerBalance).to.equal(
        initialOwnerBalance - ethers.parseEther("100")
      );
      expect(finalAddress1Balance).to.equal(
        initialAddress1Balance + ethers.parseEther("100")
      );
    });

    it("Should display user balance", async function () {
      const { token, owner } = await loadFixture(deployToken);
      const balance = await token.balanceOf(owner.address);

      const getBals = await token.getbalance();

      expect(getBals).to.equal(balance);
    });

    it("Should display token details", async function () {
      const { token, value, owner } = await loadFixture(deployToken);
      // const bals = await token.balanceOf(owner);
      const getBals = await token.getTokenDetails();

      // expect(getBals).to.deep.equal(bals); // for array
      expect(getBals[0]).to.equal("Asset"); // name
      expect(getBals[1]).to.equal("AST"); // symbol
      expect(getBals[2]).to.equal(18); // decimals
      expect(getBals[3]).to.equal(hre.ethers.parseUnits("5000", 18)); // totalSupply
    });
    it("Should revert when transferring to zero address", async function () {
      const { token, value } = await loadFixture(deployToken);
      await expect(token.transfer(ethers.ZeroAddress, value)).to.be.revertedWithCustomError(token, "InvalidAddress");
    });
    it("Should revert if sender has insufficient balance", async function () {
      const { token, address1 } = await loadFixture(deployToken);
      await expect(token.connect(address1).transfer(address1.address, ethers.parseEther("100"))).to.be.revertedWithCustomError(token, "InsufficientBalance");
    });
    it("Should revert if transferFrom is called without approval", async function () {
      const { token, address1, address2 } = await loadFixture(deployToken);
      await token.transfer(address1.address, ethers.parseEther("100"));
      await expect(token.connect(address2).transferFrom(address1.address, address2.address, ethers.parseEther("10")))
        .to.be.revertedWithCustomError(token, "NotAllow");
    });
    it("Should return 0 as contract balance initially", async function () {
      const { token } = await loadFixture(deployToken);
      const balance = await token.contractBalance();
      expect(balance).to.equal(0);
    });
    it("Should return total supply correctly", async function () {
      const { token } = await loadFixture(deployToken);
      const supply = await token.totalSupply();
      expect(supply).to.equal(ethers.parseEther("5000"));
    });
  });
});

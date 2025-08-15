import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("WEB3B", function () {

  // Should deploy and set owner correctly", Contracts are deployed using the first signer/account by default

  async function deployERC20Token() {
    const [owner, account2, account3] = await hre.ethers.getSigners();

    const name = "Web3BToken";
    const symbol = "W3B";
    const decimals = 18;
    const totalSupply = hre.ethers.parseUnits("100000000", decimals);

    const WEB3B = await hre.ethers.getContractFactory("WEB3B");
    const web3b = await WEB3B.deploy(name, symbol, decimals, totalSupply );

    console.log("Signer1 address:", owner.address);
    console.log("Signer2 address:", account2.address);
    console.log("Signer3 address:", account3.address);


    return { web3b,  owner, account2, account3, name, symbol, decimals, totalSupply};
  }
  describe("Deployment", function () {
    it("Should deploy and set owner correctly", async function () {
      const { web3b, name, symbol, decimals, totalSupply, owner } = await loadFixture(deployERC20Token);

      expect(await web3b.name()).to.equal(name);
      expect(await web3b.symbol()).to.equal(symbol);
      expect(await web3b.decimals()).to.equal(decimals);
      expect(await web3b.owner()).to.equal(owner.address);
      expect(await web3b.balanceOf(owner.address)).to.equal(totalSupply);
    });
  });
  // describe("Transfer token", function () {
  //   it("Should tranfer token to recipient <= owner's balance", async function () {
  //     const { web3b, owner, account2} = await loadFixture(deployERC20Token);

  //     await expect(web3b.transfer(account2.address, 200)).to.emit(web3b, "Transfer").withArgs (owner.address, account2.address, 200);
  //   });
  // });
  describe("Transfer token", function () {
    it("Should transfer token to recipient when amount <= owner's balance", async function () {
      const { web3b, owner, account2 } = await loadFixture(deployERC20Token);

      const transferAmount = hre.ethers.parseUnits("200", 18);
      
      await expect(web3b.transfer(account2.address, transferAmount))
        .to.emit(web3b, "Transfer")
        .withArgs(owner.address, account2.address, transferAmount);

      // Verify balances after transfer
      expect(await web3b.balanceOf(account2.address)).to.equal(transferAmount);
    });
    it("Should fail when transfer amount > owner's balance", async function () {
      const { web3b, owner, account2, totalSupply } = await loadFixture(deployERC20Token);

      const excessiveAmount = totalSupply + hre.ethers.parseUnits("1", 18);
      
      await expect(web3b.transfer(account2.address, excessiveAmount))
        .to.be.revertedWithCustomError(web3b, "INSUFFICIENT_BALANCE");
    });
    it("Should handle zero amount transfers", async function () {
      const { web3b, owner, account2 } = await loadFixture(deployERC20Token);

      await expect(web3b.transfer(account2.address, 0))
        .to.emit(web3b, "Transfer")
        .withArgs(owner.address, account2.address, 0);
    });
  });
  describe("Approval", function () {
    it("Should approve spender to spend tokens", async function () {
      const { web3b, owner, account2 } = await loadFixture(deployERC20Token);

      const approvalAmount = hre.ethers.parseUnits("1000", 18);
      
      await expect(web3b.approve(account2.address, approvalAmount))
        .to.emit(web3b, "Approval")
        .withArgs(owner.address, account2.address, approvalAmount);

      expect(await web3b.allowance(owner.address, account2.address)).to.equal(approvalAmount);
    });
  });
  describe("TransferFrom", function () {
  it("Should handle multiple transfers correctly", async function () {
      const { web3b, owner, account2, account3 } = await loadFixture(deployERC20Token);

      const amount1 = hre.ethers.parseUnits("1000", 18);
      const amount2 = hre.ethers.parseUnits("300", 18);
      
      // Owner -> account2
      await web3b.transfer(account2.address, amount1);
      
      // account 2 -> account3
      await web3b.connect(account2).transfer(account3.address, amount2);
      
      expect(await web3b.balanceOf(account2.address)).to.equal(amount1 - amount2);
      expect(await web3b.balanceOf(account3.address)).to.equal(amount2);
    });
  });


})
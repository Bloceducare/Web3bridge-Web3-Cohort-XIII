import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import {ethers} from "hardhat";

describe("Erc20",function (){
  async function deployErc(){
    
    const Erc20 = await hre.ethers.getContractFactory("Erc20");
    const erc20 = await Erc20.deploy("2000000000000000000");
    const [owner,otherAccount] = await hre.ethers.getSigners();


    return {erc20,owner,otherAccount};
  }


  describe("transfer token",function(){
    it("It should transfer token to a recipient",async function(){
      const {erc20,owner,otherAccount} = await loadFixture(deployErc);
      const amount = ethers.parseUnits("1",18); 

      const initialOwnerBalance = await erc20.balanceOf(owner.address);
      const initialRecipientBalance = await erc20.balanceOf(otherAccount.address);

      await erc20.transfer(otherAccount.address,amount);

      const finalOwnerBalance = await erc20.balanceOf(owner.address);
      const finalRecipientBalance = await erc20.balanceOf(otherAccount.address);

      expect(finalOwnerBalance).to.equal(initialOwnerBalance - amount); 
      expect(finalRecipientBalance).to.equal(initialRecipientBalance + amount);
    
  
      
    })
    it("It should revert if owner balance is less than amount",async function(){
  
       const {erc20,owner} = await loadFixture(deployErc);
       const amount = ethers.parseUnits("9",18);
       console.log(amount);
       await expect(erc20.transfer(owner.address,amount)).to.be.revertedWithCustomError(erc20,"INSUFFICIENT_BALANCE");

    })

  })

  describe("Balance Of Token",function(){
    it("Should return the balance of the token",async function(){
      const {erc20,owner} = await loadFixture(deployErc);
      const response = await erc20.balanceOf(owner.address);
      expect(response).to.equal("2000000000000000000")
    })

  })

  describe("Approve",function(){
    it("Should approve an amount that can be spent by the spender account",async function(){
      const {erc20,otherAccount,owner} = await loadFixture(deployErc);
      const amount = ethers.parseUnits("1",18); 
      await erc20.approve(otherAccount.address,amount);
      const allowance = await erc20.allowance(owner.address,otherAccount.address);
      expect(allowance).to.equal(amount);
    })

    it("Should revert approve if owner balance is less than the amount to be approved",async function(){
      const {erc20,otherAccount} = await loadFixture(deployErc);
      const amount = ethers.parseUnits("7",18);
      console.log(amount);
      await expect(erc20.approve(otherAccount,amount)).to.be.revertedWithCustomError(erc20,"INSUFFICIENT_BALANCE");


    })

  })

  describe("Allowance",function(){
    it("Should return the amount of tokens that was approved for the spender to withdraw",async function(){
      const {erc20,otherAccount,owner} = await loadFixture(deployErc);
      const amount = ethers.parseUnits("1",18); 
      await erc20.approve(otherAccount.address,amount);
      const allowance = await erc20.allowance(owner.address,otherAccount.address);
      expect(allowance).to.equal(amount);
    })
  })

  describe("TransferFrom",function(){
    it("Should allow transfer of token on behalf of the owner of another account",async function(){
        const {erc20,otherAccount,owner} = await loadFixture(deployErc);
        const transferAmount = ethers.parseUnits("1",18);
        const approveAmount = ethers.parseUnits("2",18);
  
        const initialOwnerBalance = await erc20.balanceOf(owner.address);
        const initialRecipientBalance = await erc20.balanceOf(otherAccount.address);
        await erc20.approve(otherAccount.address,approveAmount);
        await erc20.allowance(owner.address,otherAccount.address);
        await erc20.connect(otherAccount).transferFrom(owner.address,otherAccount.address,transferAmount);

        const finalOwnerBalance = await erc20.balanceOf(owner.address);
        const finalRecipientBalance = await erc20.balanceOf(otherAccount.address);

        expect(finalOwnerBalance).to.equal(initialOwnerBalance - transferAmount); 
        expect(finalRecipientBalance).to.equal(initialRecipientBalance + transferAmount);

    })

    it("Should revert if owner balance is less than the amount",async function(){
        const {erc20,owner,otherAccount} = await loadFixture(deployErc);
         const amount = ethers.parseUnits("5",18);
      
        await expect(erc20.connect(otherAccount).transferFrom(owner.address,otherAccount.address,amount)).
        to.be.revertedWithCustomError(erc20,"INSUFFICIENT_BALANCE");

    })

    it("Should revert if amount approved is less than the transfer amount",async function(){
      const {erc20,otherAccount,owner} = await loadFixture(deployErc);
        const transferAmount = ethers.parseUnits("2",18);
        const approveAmount = ethers.parseUnits("1",18);
  
        await erc20.approve(otherAccount.address,approveAmount);
        await erc20.allowance(owner.address,otherAccount.address);
        await expect(erc20.connect(otherAccount).transferFrom(owner.address,otherAccount.address,transferAmount)).to.be.revertedWithCustomError(erc20,"INSUFFICIENT_ALLOWANCE");

    })
  })

  describe("totalSupply", function() {
    it("Should return the total supply of tokens", async function() {
      const { erc20 } = await loadFixture(deployErc);
      const expectedTotalSupply = ethers.parseUnits("2", 18); 

      const totalSupply = await erc20.totalSupply();

      expect(totalSupply).to.equal(expectedTotalSupply);
    });
  });

})

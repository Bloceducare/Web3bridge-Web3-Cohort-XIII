import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";


describe("LEDATOKEN", function() {
  async function ledaTokenDeploy() {
    const Leda = await hre.ethers.getContractFactory("LEDATOKEN"); 
    const leda = await Leda.deploy(); 

    const [ owner, addr1, addr2 ] = await ethers.getSigners(); 
    return { leda, owner, addr1, addr2 }; 
  }

  describe("Transfer", function() {
    it("Should transfer token to a recipient", async function() {
      const { leda, owner, addr1, addr2 } = await loadFixture(ledaTokenDeploy); 

      const amount = await ethers.parseEther("1000"); 
      const amountToSend = await ethers.parseEther("100");

      await leda.connect(owner).mint(addr1.address, amount); 

      await leda.connect(addr1).transfer(addr2.address, amountToSend)

      const balance1 = await leda.balanceOf(addr1.address); 
      const balance2 = await leda.balanceOf(addr2.address);

      expect(balance1).to.equal(amount - amountToSend); 
      expect(balance2).to.equal(amountToSend); 

      await expect(leda.connect(addr1).transfer(addr2.address, amountToSend))
      .to.emit(leda, "Transfer")
      .withArgs(addr1.address, addr2.address, amountToSend);
    })

    it("Should reject balance less than amount", async function() {
      const { leda, owner, addr1, addr2 } = await loadFixture(ledaTokenDeploy); 

      const amount = await ethers.parseEther("500"); 
      const tooMuch = await ethers.parseEther("700"); 

      await leda.connect(owner).mint(addr1.address, amount);

      await expect(leda.connect(addr1).transfer(addr2.address, tooMuch))
      .to.be.revertedWithCustomError(leda, "InsufficientBalance")
    })

  })

  describe("Balance", function() {
    it("Balance of the account", async function() {
      const { leda, owner, addr1 } = await loadFixture(ledaTokenDeploy); 

      const amount = await ethers.parseEther("1000"); 

      await leda.connect(owner).mint(addr1.address, amount); 

      const balance = await leda.balanceOf(addr1.address); 

      expect(balance).to.equal(amount); 
    })
  })

  describe("Approve", function() {
    it("Should approve for amount for spender", async function() {
      const { leda, owner, addr1, addr2 } = await loadFixture(ledaTokenDeploy); 

      const amount = await ethers.parseEther("1000"); 
      const amountToApprove = await ethers.parseEther("500"); 

      await leda.connect(owner).mint(addr1.address, amount); 

      await leda.connect(addr1).approve(addr2.address, amountToApprove); 

      const allowance = await leda.allowance(addr1.address, addr2.address); 

      expect(allowance).to.equal(amountToApprove);
      
      await expect(
        leda.connect(addr1).approve(addr2.address, amountToApprove)
      ).to.emit(leda, "Approval").withArgs(addr1.address, addr2.address, amountToApprove); 

    })
  })

  describe("Allowance", function() {
    it("Should send allowance to the spender", async function() {
      const { leda, owner, addr1,addr2 } = await loadFixture(ledaTokenDeploy); 

      const amount = await ethers.parseEther("100");
      const amountToSend = await ethers.parseEther("50");

      await leda.connect(owner).mint(addr1.address, amount); 
      await leda.connect(addr1).approve(addr2.address, amountToSend); 

      await expect(
        leda.connect(addr2).transferFrom(addr1.address, addr2.address, amountToSend)
      ).to.emit(leda, "Transfer").withArgs(addr1.address, addr2.address, amountToSend)

      const balance1 = await leda.balanceOf(addr1.address); 
      const balance2 = await leda.balanceOf(addr2.address); 

      expect(balance1).to.equal(amount - amountToSend); 
      expect(balance2).to.equal(amountToSend); 

      const lastAllowance = await leda.allowance(addr1.address, addr2.address); 
      expect(lastAllowance).to.equal(0); 

    })
  })

  describe("Transfer From", function() {
    it("Should transfer a token from a sender to a recipient", async function() {
      const { leda, owner, addr1,addr2 } = await loadFixture(ledaTokenDeploy); 

      const amount = await ethers.parseEther("1500");
      const amountToSend = await ethers.parseEther("750");

      await leda.connect(owner).mint(addr1.address, amount); 
      await leda.connect(addr1).approve(addr2.address, amountToSend); 

      await expect(
        leda.connect(addr2).transferFrom(addr1.address, addr2.address, amountToSend)
      ).to.emit(leda, "Transfer").withArgs(addr1.address, addr2.address, amountToSend)

      const balance1 = await leda.balanceOf(addr1.address); 
      const balance2 = await leda.balanceOf(addr2.address); 
      const lastAllowance = await leda.allowance(addr1.address, addr2.address); 

      expect(balance1).to.equal(amount - amountToSend); 
      expect(balance2).to.equal(amountToSend); 
      expect(lastAllowance).to.equal(0); 

    })
    it("Should revert transfer if allowance is insufficient", async function() {
      const { leda, owner, addr1, addr2 } = await loadFixture(ledaTokenDeploy); 

      const amount = await ethers.parseEther("1500");
      const amountToSend = await ethers.parseEther("750");
      const excessAmount = await ethers.parseEther("2000"); 

      await leda.connect(owner).mint(addr1.address, amount); 
      await leda.connect(addr1).approve(addr2.address, amountToSend);
      
      await expect(
        leda.connect(addr2).transferFrom(addr1.address, addr2.address, excessAmount)
      ).to.revertedWithCustomError(leda, "AllowanceTooLow")

    })
  })

  describe("Mint", function() {
    it("Should mint the token to the owner", async function() {
      const { leda, owner, addr1 } = await loadFixture(ledaTokenDeploy); 

      const amount = await ethers.parseEther("1500");
      
      await expect(
        leda.connect(owner).mint(addr1.address, amount)
      ).to.emit(leda, "Transfer").withArgs(ethers.ZeroAddress, addr1.address, amount)

      const balance = await leda.balanceOf(addr1.address); 
      expect(balance).to.equal(amount); 

      const totalSupply = await leda.totalSupply(); 
      expect(totalSupply).to.equal(amount); 

    })
  })

  describe("Burn", function() {
    it("Should burn the token to the account zero", async function() {
      const { leda, owner, addr1 } = await loadFixture(ledaTokenDeploy); 

      const amount = ethers.parseEther("1500"); 

      await leda.connect(owner).mint(addr1.address, amount); 

      await expect(
        leda.connect(owner).burn(addr1.address, amount)
      ).to.emit(leda, "Transfer").withArgs(owner, addr1.address, amount)

      const balance = await leda.balanceOf(addr1.address); 
      expect(balance).to.equal(0); 

      const totalSupply = await leda.totalSupply(); 
      expect(totalSupply).to.equal(0); 


    })
  })



  
})
import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("BasicERC20 Deployment", function () {
  // Fixture function that deploys the contract and sets up initial state
  async function deployBasicERC20() {
    // Get test accounts - Hardhat provides these automatically
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();
    // Deploy the BasicERC20 contract
    const BasicERC20 = await hre.ethers.getContractFactory("BasicERC20");
    const basicERC20 = await BasicERC20.deploy();
    
    // Return all the things we'll need in our tests
    return { basicERC20, owner, addr1, addr2, addr3 };
  }
       it("Should set the correct token name", async function () {
    // Get a fresh contract
    const { basicERC20 } = await loadFixture(deployBasicERC20);
    
    // Check if the name is correct
    expect(await basicERC20.name()).to.equal("Basic Token");
  });
        it("Should set the correct symbol", async function () {
    const { basicERC20 } = await loadFixture(deployBasicERC20);
    expect(await basicERC20.symbol()).to.equal("BASIC");
  });
        it("Should give all tokens to the owner", async function () {
    const { basicERC20, owner } = await loadFixture(deployBasicERC20);
    
    const ownerBalance = await basicERC20.balanceOf(owner.address);
    const totalSupply = await basicERC20.totalSupply();
    
    expect(ownerBalance).to.equal(totalSupply);
  });

       it("Should set the correct total supply", async function () {
      const { basicERC20 } = await loadFixture(deployBasicERC20);
      
      // Total supply should be 1 million tokens (1000000 * 10^18)
      const expectedSupply = hre.ethers.parseEther("1000000");
      expect(await basicERC20.totalSupply()).to.equal(expectedSupply);
    });

    it("Should transfer tokens successfully", async function () {
      const { basicERC20, owner, addr1 } = await loadFixture(deployBasicERC20);
      
      // Define the amount to transfer (100 tokens)
      const transferAmount = hre.ethers.parseEther("100");
      
      // Get initial balances
      const initialOwnerBalance = await basicERC20.balanceOf(owner.address);
      const initialAddr1Balance = await basicERC20.balanceOf(addr1.address);
      
      // Perform the transfer
      await basicERC20.transfer(addr1.address, transferAmount);
      
      // Check that balances updated correctly
      const finalOwnerBalance = await basicERC20.balanceOf(owner.address);
      const finalAddr1Balance = await basicERC20.balanceOf(addr1.address);
      
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - transferAmount);
      expect(finalAddr1Balance).to.equal(initialAddr1Balance + transferAmount);
    });

    it("Should emit Transfer event", async function () {
      const { basicERC20, owner, addr1 } = await loadFixture(deployBasicERC20);
      
      const transferAmount = hre.ethers.parseEther("50");
      
      // Check that the transfer emits the correct event
      await expect(basicERC20.transfer(addr1.address, transferAmount))
        .to.emit(basicERC20, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });
    it("Should fail when transferring to zero address", async function () {
      const { basicERC20 } = await loadFixture(deployBasicERC20);
      
      const transferAmount = hre.ethers.parseEther("100");
      
      // This should fail with "Transfer to zero address" error
      await expect(
        basicERC20.transfer(hre.ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWith("Transfer to zero address");
    });

    it("Should transfer tokens using allowance", async function () {
      const { basicERC20, owner, addr1, addr2 } = await loadFixture(deployBasicERC20);
      
      const approveAmount = hre.ethers.parseEther("500");
      const transferAmount = hre.ethers.parseEther("200");
      
      // Step 1: Owner approves addr1 to spend tokens
      await basicERC20.approve(addr1.address, approveAmount);
      
      // Step 2: addr1 transfers tokens from owner to addr2
      await basicERC20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      
      // Step 3: Check that addr2 received the tokens
      const addr2Balance = await basicERC20.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
      
      // Step 4: Check that allowance decreased
      const remainingAllowance = await basicERC20.allowance(owner.address, addr1.address);
      expect(remainingAllowance).to.equal(approveAmount - transferAmount);
    });

    it("Should emit Transfer event on transferFrom", async function () {
      const { basicERC20, owner, addr1, addr2 } = await loadFixture(deployBasicERC20);
      
      const approveAmount = hre.ethers.parseEther("500");
      const transferAmount = hre.ethers.parseEther("100");
      
      // Setup: approve first
      await basicERC20.approve(addr1.address, approveAmount);
      
      // Check that transferFrom emits Transfer event
      await expect(
        basicERC20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.emit(basicERC20, "Transfer")
       .withArgs(owner.address, addr2.address, transferAmount);
    });

     it("Should return correct balances", async function () {
      const { basicERC20, owner, addr1 } = await loadFixture(deployBasicERC20);
      
      // Initially, owner has all tokens, addr1 has none
      const totalSupply = await basicERC20.totalSupply();
      expect(await basicERC20.balanceOf(owner.address)).to.equal(totalSupply);
      expect(await basicERC20.balanceOf(addr1.address)).to.equal(0);
      
      // After transfer, balances should update
      const transferAmount = hre.ethers.parseEther("250");
      await basicERC20.transfer(addr1.address, transferAmount);
      
      expect(await basicERC20.balanceOf(owner.address)).to.equal(totalSupply - transferAmount);
      expect(await basicERC20.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should return correct allowances", async function () {
      const { basicERC20, owner, addr1, addr2 } = await loadFixture(deployBasicERC20);
      
      // Initially, no allowances exist
      expect(await basicERC20.allowance(owner.address, addr1.address)).to.equal(0);
      expect(await basicERC20.allowance(owner.address, addr2.address)).to.equal(0);
      
      // After approvals, allowances should be set
      const allowance1 = hre.ethers.parseEther("100");
      const allowance2 = hre.ethers.parseEther("200");
      
      await basicERC20.approve(addr1.address, allowance1);
      await basicERC20.approve(addr2.address, allowance2);
      
      expect(await basicERC20.allowance(owner.address, addr1.address)).to.equal(allowance1);
      expect(await basicERC20.allowance(owner.address, addr2.address)).to.equal(allowance2);
    });

});

import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("Staking Contract", function () {
    let token1: Contract;
    let token2: Contract;
    let stakingContract: Contract;
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let user1Address: string;
    let user2Address: string;
    let ownerAddress: string;
    
    const lockPeriod = 7 * 24 * 60 * 60; // 7 days
    const stakeAmount = ethers.parseEther("100");
    
    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
        user1Address = await user1.getAddress();
        user2Address = await user2.getAddress();
        
        const Token1 = await ethers.getContractFactory("Token1");
        const Token2 = await ethers.getContractFactory("Token2");
        const StakingContract = await ethers.getContractFactory("StakingContract");
        
        token1 = await Token1.deploy();
        token2 = await Token2.deploy();
        stakingContract = await StakingContract.deploy(await token1.getAddress(), await token2.getAddress(), lockPeriod);
        
        await token1.transfer(user1Address, ethers.parseEther("1000"));
        await token1.transfer(user2Address, ethers.parseEther("1000"));
    });
    
    describe("Deployment", function () {
        it("Should set correct token addresses and lock period", async function () {
            expect(await stakingContract.token1()).to.equal(await token1.getAddress());
            expect(await stakingContract.token2()).to.equal(await token2.getAddress());
            expect(await stakingContract.lockPeriod()).to.equal(lockPeriod);
        });
    });
    
    describe("Staking", function () {
        beforeEach(async function () {
            await token1.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
        });
        
        it("Should stake Token A and mint Token B at 1:1 ratio", async function () {
            const initialToken1Balance = await token1.balanceOf(user1Address);
            const initialToken2Balance = await token2.balanceOf(user1Address);
            
            await stakingContract.connect(user1).stake(stakeAmount);
            
            expect(await token1.balanceOf(user1Address)).to.equal(initialToken1Balance - stakeAmount);
            expect(await token2.balanceOf(user1Address)).to.equal(initialToken2Balance + stakeAmount);
            expect(await token1.balanceOf(await stakingContract.getAddress())).to.equal(stakeAmount);
        });
        
        it("Should track user stake info correctly", async function () {
            await stakingContract.connect(user1).stake(stakeAmount);
            
            const [amount, unlockTime] = await stakingContract.getStakeInfo(user1Address);
            expect(amount).to.equal(stakeAmount);
            expect(unlockTime).to.be.gt(Math.floor(Date.now() / 1000));
        });
        
        it("Should allow multiple stakes from same user", async function () {
            await stakingContract.connect(user1).stake(stakeAmount);
            await token1.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount);
            
            const [amount, unlockTime] = await stakingContract.getStakeInfo(user1Address);
            expect(amount).to.equal(stakeAmount * 2n);
        });
        
        it("Should revert if amount is zero", async function () {
            await expect(stakingContract.connect(user1).stake(0)).to.be.revertedWith("Amount must be greater than 0");
        });
        
        it("Should revert if insufficient allowance", async function () {
            await expect(stakingContract.connect(user2).stake(stakeAmount)).to.be.revertedWith("Insufficient allowance");
        });
    });
    
    describe("Unstaking", function () {
        beforeEach(async function () {
            await token1.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount);
        });
        
        it("Should burn Token B when unstaking", async function () {
            const initialToken2Balance = await token2.balanceOf(user1Address);
            
            await stakingContract.connect(user1).unstake(stakeAmount);
            
            expect(await token2.balanceOf(user1Address)).to.equal(initialToken2Balance - stakeAmount);
        });
        
        it("Should add to pending unstakes if lock period not expired", async function () {
            await stakingContract.connect(user1).unstake(stakeAmount);
            
            expect(await stakingContract.getPendingUnstake(user1Address)).to.equal(stakeAmount);
            expect(await stakingContract.canUnstake(user1Address)).to.be.false;
        });
        
        it("Should allow immediate unstaking after lock period", async function () {
            await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
            await ethers.provider.send("evm_mine", []);
            
            const initialToken1Balance = await token1.balanceOf(user1Address);
            
            await stakingContract.connect(user1).unstake(stakeAmount);
            
            expect(await token1.balanceOf(user1Address)).to.equal(initialToken1Balance + stakeAmount);
            expect(await stakingContract.getPendingUnstake(user1Address)).to.equal(0);
        });
        
        it("Should allow claiming pending unstakes after lock period", async function () {
            await stakingContract.connect(user1).unstake(stakeAmount);
            
            await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
            await ethers.provider.send("evm_mine", []);
            
            const initialToken1Balance = await token1.balanceOf(user1Address);
            
            await stakingContract.connect(user1).claimUnstaked();
            
            expect(await token1.balanceOf(user1Address)).to.equal(initialToken1Balance + stakeAmount);
            expect(await stakingContract.getPendingUnstake(user1Address)).to.equal(0);
        });
        
        it("Should revert unstaking if insufficient Token B balance", async function () {
            await token2.connect(user1).transfer(user2Address, await token2.balanceOf(user1Address));
            
            await expect(stakingContract.connect(user1).unstake(stakeAmount)).to.be.revertedWith("Insufficient Token 2 balance");
        });
        
        it("Should revert unstaking if amount is zero", async function () {
            await expect(stakingContract.connect(user1).unstake(0)).to.be.revertedWith("Amount must be greater than 0");
        });
        
        it("Should revert claiming if no pending unstakes", async function () {
            await expect(stakingContract.connect(user1).claimUnstaked()).to.be.revertedWith("No pending unstakes");
        });
        
        it("Should revert claiming if lock period not expired", async function () {
            await stakingContract.connect(user1).unstake(stakeAmount);
            
            await expect(stakingContract.connect(user1).claimUnstaked()).to.be.revertedWith("Lock period not expired");
        });
    });
    
    describe("Edge Cases", function () {
        it("Should handle multiple users staking and unstaking", async function () {
            await token1.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await token1.connect(user2).approve(await stakingContract.getAddress(), stakeAmount);
            
            await stakingContract.connect(user1).stake(stakeAmount);
            await stakingContract.connect(user2).stake(stakeAmount);
            
            expect(await token2.balanceOf(user1Address)).to.equal(stakeAmount);
            expect(await token2.balanceOf(user2Address)).to.equal(stakeAmount);
            
            await stakingContract.connect(user1).unstake(stakeAmount);
            await stakingContract.connect(user2).unstake(stakeAmount);
            
            expect(await stakingContract.getPendingUnstake(user1Address)).to.equal(stakeAmount);
            expect(await stakingContract.getPendingUnstake(user2Address)).to.equal(stakeAmount);
        });
        
        it("Should handle partial unstaking", async function () {
            await token1.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount);
            
            const partialAmount = ethers.parseEther("50");
            await stakingContract.connect(user1).unstake(partialAmount);
            
            const [remainingAmount, unlockTime] = await stakingContract.getStakeInfo(user1Address);
            expect(remainingAmount).to.equal(stakeAmount - partialAmount);
            expect(await stakingContract.getPendingUnstake(user1Address)).to.equal(partialAmount);
        });
    });
});
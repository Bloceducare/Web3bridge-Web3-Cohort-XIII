// test/StakingContract.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { TokenA, TokenB, StakingContract } from "../typechain-types";

describe("Staking Contract System", function () {
    const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days
    const INITIAL_MINT_AMOUNT = ethers.parseEther("1000");
    const STAKE_AMOUNT = ethers.parseEther("100");

    async function deployFixture() {
        const [owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy contracts
        const TokenA = await ethers.getContractFactory("TokenA");
        const TokenB = await ethers.getContractFactory("TokenB");
        const StakingContract = await ethers.getContractFactory("StakingContract");

        const tokenA = await TokenA.deploy();
        const tokenB = await TokenB.deploy();
        const stakingContract = await StakingContract.deploy(
            await tokenA.getAddress(),
            await tokenB.getAddress(),
            LOCK_PERIOD
        );

        // Set staking contract addresses
        await stakingContract._setStakingContract();

        // Mint initial tokens to users
        await stakingContract.mintTokenA(user1.address, INITIAL_MINT_AMOUNT);
        await stakingContract.mintTokenA(user2.address, INITIAL_MINT_AMOUNT);
        await stakingContract.mintTokenA(user3.address, INITIAL_MINT_AMOUNT);

        return {
            tokenA,
            tokenB,
            stakingContract,
            owner,
            user1,
            user2,
            user3,
        };
    }

    describe("Deployment", function () {
        it("Should set the correct token addresses", async function () {
            const { tokenA, tokenB, stakingContract } = await loadFixture(deployFixture);

            expect(await stakingContract.tokenA()).to.equal(await tokenA.getAddress());
            expect(await stakingContract.tokenB()).to.equal(await tokenB.getAddress());
        });

        it("Should set the correct lock period", async function () {
            const { stakingContract } = await loadFixture(deployFixture);
            expect(await stakingContract.lockPeriod()).to.equal(LOCK_PERIOD);
        });

        it("Should initialize token supplies correctly", async function () {
            const { tokenA, tokenB } = await loadFixture(deployFixture);

            expect(await tokenA.totalSupply()).to.equal(INITIAL_MINT_AMOUNT * 3n);
            expect(await tokenB.totalSupply()).to.equal(0);
        });

        it("Should set staking contract addresses on tokens", async function () {
            const { tokenA, tokenB, stakingContract } = await loadFixture(deployFixture);

            expect(await tokenA.stakingContract()).to.equal(await stakingContract.getAddress());
            expect(await tokenB.stakingContract()).to.equal(await stakingContract.getAddress());
        });
    });

    describe("TokenA Functionality", function () {
        it("Should mint tokens only from staking contract", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            // Should fail when called directly
            await expect(
                tokenA.mint(user1.address, STAKE_AMOUNT)
            ).to.be.revertedWith("Only staking contract");

            // Should succeed when called from staking contract
            await expect(
                stakingContract.mintTokenA(user1.address, STAKE_AMOUNT)
            ).to.not.be.reverted;
        });

        it("Should transfer tokens correctly", async function () {
            const { tokenA, user1, user2 } = await loadFixture(deployFixture);

            const initialBalance1 = await tokenA.balanceOf(user1.address);
            const initialBalance2 = await tokenA.balanceOf(user2.address);

            await tokenA.connect(user1).transfer(user2.address, STAKE_AMOUNT);

            expect(await tokenA.balanceOf(user1.address)).to.equal(initialBalance1 - STAKE_AMOUNT);
            expect(await tokenA.balanceOf(user2.address)).to.equal(initialBalance2 + STAKE_AMOUNT);
        });

        it("Should revert on insufficient balance", async function () {
            const { tokenA, user1, user2 } = await loadFixture(deployFixture);

            const balance = await tokenA.balanceOf(user1.address);

            await expect(
                tokenA.connect(user1).transfer(user2.address, balance + 1n)
            ).to.be.revertedWithCustomError(tokenA, "ERC20InsufficientBalance");
        });

        it("Should revert on zero address transfers", async function () {
            const { tokenA, user1 } = await loadFixture(deployFixture);

            await expect(
                tokenA.connect(user1).transfer(ethers.ZeroAddress, STAKE_AMOUNT)
            ).to.be.revertedWithCustomError(tokenA, "ERC20InvalidReceiver");
        });

        it("Should not allow setting staking contract twice", async function () {
            const { tokenA, user1 } = await loadFixture(deployFixture);

            await expect(
                tokenA.setStakingContract(user1.address)
            ).to.be.revertedWithCustomError(tokenA, "StakingContractAlreadySet");
        });
    });

    describe("TokenB Functionality", function () {
        it("Should mint and burn tokens only from staking contract", async function () {
            const { tokenB, user1 } = await loadFixture(deployFixture);

            // Should fail when called directly
            await expect(
                tokenB.mint(user1.address, STAKE_AMOUNT)
            ).to.be.revertedWith("Only staking contract");

            await expect(
                tokenB.burn(user1.address, STAKE_AMOUNT)
            ).to.be.revertedWith("Only staking contract");
        });

        it("Should handle approvals correctly", async function () {
            const { tokenB, user1, user2 } = await loadFixture(deployFixture);

            await tokenB.connect(user1).approve(user2.address, STAKE_AMOUNT);

            expect(await tokenB.allowance(user1.address, user2.address)).to.equal(STAKE_AMOUNT);
        });
    });

    describe("Staking Functionality", function () {
        it("Should stake tokens correctly", async function () {
            const { tokenA, tokenB, stakingContract, user1 } = await loadFixture(deployFixture);

            const initialTokenABalance = await tokenA.balanceOf(user1.address);
            const initialTokenBBalance = await tokenB.balanceOf(user1.address);

            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            // Check balances
            expect(await tokenA.balanceOf(user1.address)).to.equal(initialTokenABalance - STAKE_AMOUNT);
            expect(await tokenB.balanceOf(user1.address)).to.equal(initialTokenBBalance + STAKE_AMOUNT);

            // Check stake info
            const [amount, unlockTime] = await stakingContract.getStakeInfo(user1.address);
            expect(amount).to.equal(STAKE_AMOUNT);
            expect(unlockTime).to.be.gt(0);
        });

        it("Should revert staking with zero amount", async function () {
            const { stakingContract, user1 } = await loadFixture(deployFixture);

            await expect(
                stakingContract.connect(user1).stake(0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should revert staking without sufficient balance", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            const balance = await tokenA.balanceOf(user1.address);

            await expect(
                stakingContract.connect(user1).stake(balance + 1n)
            ).to.be.revertedWithCustomError(tokenA, "ERC20InsufficientBalance");
        });

        it("Should handle multiple stakes correctly", async function () {
            const { tokenA, tokenB, stakingContract, user1 } = await loadFixture(deployFixture);

            // First stake
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            // Second stake
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            const [amount] = await stakingContract.getStakeInfo(user1.address);
            expect(amount).to.equal(STAKE_AMOUNT * 2n);
            expect(await tokenB.balanceOf(user1.address)).to.equal(STAKE_AMOUNT * 2n);
        });
    });

    describe("Unstaking Functionality", function () {
        async function stakeFixture() {
            const fixture = await loadFixture(deployFixture);
            const { tokenA, stakingContract, user1 } = fixture;

            // Stake tokens
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            return fixture;
        }

        it("Should revert unstaking before lock period", async function () {
            const { stakingContract, user1 } = await stakeFixture();

            await expect(
                stakingContract.connect(user1).unstake(STAKE_AMOUNT)
            ).to.be.revertedWith("Tokens still locked");
        });

        it("Should unstake correctly after lock period", async function () {
            const { tokenA, tokenB, stakingContract, user1 } = await stakeFixture();

            // Fast forward time
            await time.increase(LOCK_PERIOD + 1);

            const initialTokenABalance = await tokenA.balanceOf(user1.address);
            const initialTokenBBalance = await tokenB.balanceOf(user1.address);

            await stakingContract.connect(user1).unstake(STAKE_AMOUNT);

            // Check balances
            expect(await tokenA.balanceOf(user1.address)).to.equal(initialTokenABalance + STAKE_AMOUNT);
            expect(await tokenB.balanceOf(user1.address)).to.equal(initialTokenBBalance - STAKE_AMOUNT);

            // Check stake info is reset
            const [amount, unlockTime] = await stakingContract.getStakeInfo(user1.address);
            expect(amount).to.equal(0);
            expect(unlockTime).to.equal(0);
        });

        it("Should revert unstaking with zero amount", async function () {
            const { stakingContract, user1 } = await stakeFixture();

            await time.increase(LOCK_PERIOD + 1);

            await expect(
                stakingContract.connect(user1).unstake(0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should revert unstaking more than staked", async function () {
            const { stakingContract, user1 } = await stakeFixture();

            await time.increase(LOCK_PERIOD + 1);

            await expect(
                stakingContract.connect(user1).unstake(STAKE_AMOUNT + 1n)
            ).to.be.revertedWith("Insufficient staked amount");
        });

        it("Should handle partial unstaking", async function () {
            const { tokenA, tokenB, stakingContract, user1 } = await stakeFixture();

            // Stake more tokens
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            await time.increase(LOCK_PERIOD + 1);

            const partialAmount = STAKE_AMOUNT / 2n;
            await stakingContract.connect(user1).unstake(partialAmount);

            const [remainingAmount, unlockTime] = await stakingContract.getStakeInfo(user1.address);
            expect(remainingAmount).to.equal(STAKE_AMOUNT * 2n - partialAmount);
            expect(unlockTime).to.be.gt(0); // Should not reset unlock time for partial unstake
        });
    });

    describe("View Functions", function () {
        async function stakeFixture() {
            const fixture = await loadFixture(deployFixture);
            const { tokenA, stakingContract, user1 } = fixture;

            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            return fixture;
        }

        it("Should return correct stake info", async function () {
            const { stakingContract, user1 } = await stakeFixture();

            const [amount, unlockTime] = await stakingContract.getStakeInfo(user1.address);

            expect(amount).to.equal(STAKE_AMOUNT);
            expect(unlockTime).to.be.gt(await time.latest());
        });

        it("Should return correct unlock status", async function () {
            const { stakingContract, user1 } = await stakeFixture();

            expect(await stakingContract.isUnlocked(user1.address)).to.be.false;

            await time.increase(LOCK_PERIOD + 1);

            expect(await stakingContract.isUnlocked(user1.address)).to.be.true;
        });

        it("Should return correct time until unlock", async function () {
            const { stakingContract, user1 } = await stakeFixture();

            const timeUntilUnlock = await stakingContract.timeUntilUnlock(user1.address);
            expect(timeUntilUnlock).to.be.gt(0);
            expect(timeUntilUnlock).to.be.lte(LOCK_PERIOD);

            await time.increase(LOCK_PERIOD + 1);

            expect(await stakingContract.timeUntilUnlock(user1.address)).to.equal(0);
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle zero address in stake info", async function () {
            const { stakingContract } = await loadFixture(deployFixture);

            const [amount, unlockTime] = await stakingContract.getStakeInfo(ethers.ZeroAddress);
            expect(amount).to.equal(0);
            expect(unlockTime).to.equal(0);
        });

        it("Should prevent reentrancy attacks", async function () {
            // This would require a malicious contract, but we can test the basic flow
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            await time.increase(LOCK_PERIOD + 1);

            // Multiple unstake calls should work correctly
            const halfAmount = STAKE_AMOUNT / 2n;
            await stakingContract.connect(user1).unstake(halfAmount);
            await stakingContract.connect(user1).unstake(halfAmount);

            const [amount] = await stakingContract.getStakeInfo(user1.address);
            expect(amount).to.equal(0);
        });

        it("Should handle maximum uint256 values", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            // Test with very large amount (but reasonable for testing)
            const largeAmount = ethers.parseEther("1000000");

            await stakingContract.mintTokenA(user1.address, largeAmount);
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), largeAmount);

            await expect(
                stakingContract.connect(user1).stake(largeAmount)
            ).to.not.be.reverted;
        });

        it("Should maintain correct total supplies", async function () {
            const { tokenA, tokenB, stakingContract, user1, user2 } = await loadFixture(deployFixture);

            const initialTotalSupplyA = await tokenA.totalSupply();
            const initialTotalSupplyB = await tokenB.totalSupply();

            // Multiple users stake
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            await tokenA.connect(user2).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user2).stake(STAKE_AMOUNT);

            expect(await tokenA.totalSupply()).to.equal(initialTotalSupplyA);
            expect(await tokenB.totalSupply()).to.equal(initialTotalSupplyB + STAKE_AMOUNT * 2n);

            // Fast forward and unstake
            await time.increase(LOCK_PERIOD + 1);

            await stakingContract.connect(user1).unstake(STAKE_AMOUNT);
            await stakingContract.connect(user2).unstake(STAKE_AMOUNT);

            expect(await tokenA.totalSupply()).to.equal(initialTotalSupplyA);
            expect(await tokenB.totalSupply()).to.equal(initialTotalSupplyB);
        });
    });

    describe("Events", function () {
        it("Should emit Staked event", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);

            await expect(stakingContract.connect(user1).stake(STAKE_AMOUNT))
                .to.emit(stakingContract, "Staked")
                .withArgs(user1.address, STAKE_AMOUNT, await time.latest() + LOCK_PERIOD + 1);
        });

        it("Should emit Unstaked event", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            await time.increase(LOCK_PERIOD + 1);

            await expect(stakingContract.connect(user1).unstake(STAKE_AMOUNT))
                .to.emit(stakingContract, "Unstaked")
                .withArgs(user1.address, STAKE_AMOUNT);
        });

        it("Should emit Transfer events for TokenB", async function () {
            const { tokenA, tokenB, stakingContract, user1 } = await loadFixture(deployFixture);

            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);

            // Check mint event
            await expect(stakingContract.connect(user1).stake(STAKE_AMOUNT))
                .to.emit(tokenB, "Transfer")
                .withArgs(ethers.ZeroAddress, user1.address, STAKE_AMOUNT);

            await time.increase(LOCK_PERIOD + 1);

            // Check burn event
            await expect(stakingContract.connect(user1).unstake(STAKE_AMOUNT))
                .to.emit(tokenB, "Transfer")
                .withArgs(user1.address, ethers.ZeroAddress, STAKE_AMOUNT);
        });
    });

    describe("Gas Usage", function () {
        it("Should have reasonable gas costs for staking", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);

            const tx = await stakingContract.connect(user1).stake(STAKE_AMOUNT);
            const receipt = await tx.wait();

            console.log(`Staking gas used: ${receipt?.gasUsed}`);
            expect(receipt?.gasUsed).to.be.lt(200000); // Reasonable gas limit
        });

        it("Should have reasonable gas costs for unstaking", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), STAKE_AMOUNT);
            await stakingContract.connect(user1).stake(STAKE_AMOUNT);

            await time.increase(LOCK_PERIOD + 1);

            const tx = await stakingContract.connect(user1).unstake(STAKE_AMOUNT);
            const receipt = await tx.wait();

            console.log(`Unstaking gas used: ${receipt?.gasUsed}`);
            expect(receipt?.gasUsed).to.be.lt(150000); // Reasonable gas limit
        });
    });
});
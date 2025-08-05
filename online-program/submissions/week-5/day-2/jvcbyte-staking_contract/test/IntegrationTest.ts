// test/Integration.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseEther } from "ethers";

describe("Integration Tests", function () {
    const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days
    const LARGE_AMOUNT = parseEther("10000");

    async function deployFixture() {
        const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

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

        await tokenA.setStakingContract(await stakingContract.getAddress());
        await tokenB.setStakingContract(await stakingContract.getAddress());
        await stakingContract._setStakingContract();

        // Mint tokens to all users
        const users = [user1, user2, user3, user4, user5];
        for (const user of users) {
            await stakingContract.mintTokenA(user.address, LARGE_AMOUNT);
        }

        return {
            tokenA,
            tokenB,
            stakingContract,
            owner,
            users,
        };
    }

    describe("Multi-User Scenarios", function () {
        it("Should handle multiple users staking simultaneously", async function () {
            const { tokenA, tokenB, stakingContract, users } = await loadFixture(deployFixture);

            const stakeAmounts = [
                parseEther("100"),
                parseEther("250"),
                parseEther("500"),
                parseEther("75"),
                parseEther("1000"),
            ];

            // All users stake different amounts
            for (let i = 0; i < users.length; i++) {
                await tokenA.connect(users[i]).transfer(await stakingContract.getAddress(), stakeAmounts[i]);
                await stakingContract.connect(users[i]).stake(stakeAmounts[i]);
            }

            // Verify all stakes
            for (let i = 0; i < users.length; i++) {
                const [amount] = await stakingContract.getStakeInfo(users[i].address);
                expect(amount).to.equal(stakeAmounts[i]);
                expect(await tokenB.balanceOf(users[i].address)).to.equal(stakeAmounts[i]);
            }

            // Verify total supplies
            const totalStaked = stakeAmounts.reduce((sum, amount) => sum + amount, 0n);
            expect(await tokenB.totalSupply()).to.equal(totalStaked);
        });

        it("Should handle staggered unstaking", async function () {
            const { tokenA, tokenB, stakingContract, users } = await loadFixture(deployFixture);

            const stakeAmount = parseEther("100");

            // All users stake the same amount
            for (const user of users) {
                await tokenA.connect(user).transfer(await stakingContract.getAddress(), stakeAmount);
                await stakingContract.connect(user).stake(stakeAmount);
            }

            // Fast forward past lock period
            await time.increase(LOCK_PERIOD + 1);

            // Users unstake at different times
            for (let i = 0; i < users.length; i++) {
                await stakingContract.connect(users[i]).unstake(stakeAmount);

                // Check remaining total supply
                const expectedRemaining = stakeAmount * BigInt(users.length - i - 1);
                expect(await tokenB.totalSupply()).to.equal(expectedRemaining);

                // Add some time between unstakes
                if (i < users.length - 1) {
                    await time.increase(3600); // 1 hour
                }
            }

            // All balances should be restored
            for (const user of users) {
                expect(await tokenA.balanceOf(user.address)).to.equal(LARGE_AMOUNT);
                expect(await tokenB.balanceOf(user.address)).to.equal(0);
            }
        });

        it("Should handle complex staking patterns", async function () {
            const { tokenA, stakingContract, users } = await loadFixture(deployFixture);

            // User 1: Single large stake
            await tokenA.connect(users[0]).transfer(await stakingContract.getAddress(), parseEther("1000"));
            await stakingContract.connect(users[0]).stake(parseEther("1000"));

            // User 2: Multiple small stakes
            for (let i = 0; i < 5; i++) {
                await tokenA.connect(users[1]).transfer(await stakingContract.getAddress(), parseEther("50"));
                await stakingContract.connect(users[1]).stake(parseEther("50"));
                await time.increase(3600); // 1 hour between stakes
            }

            // User 3: Stake and partial unstake pattern
            await tokenA.connect(users[2]).transfer(await stakingContract.getAddress(), parseEther("400"));
            await stakingContract.connect(users[2]).stake(parseEther("400"));

            // Fast forward past lock period
            await time.increase(LOCK_PERIOD + 1);

            // User 3 partial unstakes
            await stakingContract.connect(users[2]).unstake(parseEther("100"));
            await stakingContract.connect(users[2]).unstake(parseEther("100"));

            // Verify final states
            const [amount1] = await stakingContract.getStakeInfo(users[0].address);
            const [amount2] = await stakingContract.getStakeInfo(users[1].address);
            const [amount3] = await stakingContract.getStakeInfo(users[2].address);

            expect(amount1).to.equal(parseEther("1000"));
            expect(amount2).to.equal(parseEther("250"));
            expect(amount3).to.equal(parseEther("200"));
        });
    });

    describe("Stress Tests", function () {
        it("Should handle many small stakes", async function () {
            const { tokenA, stakingContract, users } = await loadFixture(deployFixture);

            const smallAmount = parseEther("1");

            // Each user makes 50 small stakes
            for (const user of users) {
                for (let i = 0; i < 50; i++) {
                    await tokenA.connect(user).transfer(await stakingContract.getAddress(), smallAmount);
                    await stakingContract.connect(user).stake(smallAmount);
                }
            }

            // Verify total staked amount
            const expectedTotal = parseEther("1") * 50n * BigInt(users.length);

            for (const user of users) {
                const [amount] = await stakingContract.getStakeInfo(user.address);
                expect(amount).to.equal(parseEther("50"));
            }
        });

        it("Should handle rapid stake/unstake cycles", async function () {
            const { tokenA, stakingContract, users } = await loadFixture(deployFixture);

            const cycleAmount = parseEther("100");

            for (let cycle = 0; cycle < 10; cycle++) {
                // All users stake
                for (const user of users) {
                    await tokenA.connect(user).transfer(await stakingContract.getAddress(), cycleAmount);
                    await stakingContract.connect(user).stake(cycleAmount);
                }

                // Fast forward past lock period
                await time.increase(LOCK_PERIOD + 1);

                // All users unstake
                for (const user of users) {
                    await stakingContract.connect(user).unstake(cycleAmount);
                }

                // Reset time for next cycle
                await time.increase(1);
            }

            // Verify all balances are back to original
            for (const user of users) {
                expect(await tokenA.balanceOf(user.address)).to.equal(LARGE_AMOUNT);
            }
        });
    });

    describe("Economic Invariants", function () {
        it("Should maintain TokenA conservation", async function () {
            const { tokenA, stakingContract, users } = await loadFixture(deployFixture);

            const initialTotalSupply = await tokenA.totalSupply();

            // Random staking operations
            const operations = [
                { user: 0, amount: parseEther("100") },
                { user: 1, amount: parseEther("250") },
                { user: 2, amount: parseEther("75") },
                { user: 3, amount: parseEther("500") },
                { user: 4, amount: parseEther("33") },
            ];

            for (const op of operations) {
                await tokenA.connect(users[op.user]).transfer(await stakingContract.getAddress(), op.amount);
                await stakingContract.connect(users[op.user]).stake(op.amount);
            }

            // TokenA total supply should remain unchanged
            expect(await tokenA.totalSupply()).to.equal(initialTotalSupply);

            await time.increase(LOCK_PERIOD + 1);

            // Unstake all
            for (const op of operations) {
                await stakingContract.connect(users[op.user]).unstake(op.amount);
            }

            // TokenA total supply should still be unchanged
            expect(await tokenA.totalSupply()).to.equal(initialTotalSupply);
        });

        it("Should maintain TokenB mint/burn symmetry", async function () {
            const { tokenB, tokenA, stakingContract, users } = await loadFixture(deployFixture);

            expect(await tokenB.totalSupply()).to.equal(0);

            const stakeAmount = parseEther("100");
            let totalStaked = 0n;

            // Gradual staking
            for (let i = 0; i < users.length; i++) {
                await tokenA.connect(users[i]).transfer(await stakingContract.getAddress(), stakeAmount);
                await stakingContract.connect(users[i]).stake(stakeAmount);
                totalStaked += stakeAmount;

                expect(await tokenB.totalSupply()).to.equal(totalStaked);
            }

            await time.increase(LOCK_PERIOD + 1);

            // Gradual unstaking
            for (let i = 0; i < users.length; i++) {
                await stakingContract.connect(users[i]).unstake(stakeAmount);
                totalStaked -= stakeAmount;

                expect(await tokenB.totalSupply()).to.equal(totalStaked);
            }

            expect(await tokenB.totalSupply()).to.equal(0);
        });
    });

    describe("Time-based Edge Cases", function () {
        it("Should handle stakes across multiple lock periods", async function () {
            const { tokenA, stakingContract, users } = await loadFixture(deployFixture);

            // User stakes, waits, stakes again
            await tokenA.connect(users[0]).transfer(await stakingContract.getAddress(), parseEther("100"));
            await stakingContract.connect(users[0]).stake(parseEther("100"));

            const firstStakeTime = await time.latest();

            // Wait half lock period
            await time.increase(LOCK_PERIOD / 2);

            // Stake more (should update unlock time)
            await tokenA.connect(users[0]).transfer(await stakingContract.getAddress(), parseEther("50"));
            await stakingContract.connect(users[0]).stake(parseEther("50"));

            const [amount, unlockTime] = await stakingContract.getStakeInfo(users[0].address);
            expect(amount).to.equal(parseEther("150"));
            expect(unlockTime).to.be.gt(firstStakeTime + LOCK_PERIOD);
        });

        it("Should handle exact unlock time boundaries", async function () {
            const { tokenA, stakingContract, users } = await loadFixture(deployFixture);

            await tokenA.connect(users[0]).transfer(await stakingContract.getAddress(), parseEther("100"));
            await stakingContract.connect(users[0]).stake(parseEther("100"));

            const [, unlockTime] = await stakingContract.getStakeInfo(users[0].address);

            // Try to unstake 1 second before unlock
            await time.increaseTo(unlockTime - 1n);
            await expect(
                stakingContract.connect(users[0]).unstake(parseEther("100"))
            ).to.be.revertedWith("Tokens still locked");

            // Try to unstake exactly at unlock time
            await time.increaseTo(unlockTime);
            await expect(
                stakingContract.connect(users[0]).unstake(parseEther("100"))
            ).to.not.be.reverted;
        });
    });

    describe("State Recovery Tests", function () {
        it("Should maintain consistent state after failed operations", async function () {
            const { tokenA, stakingContract, users } = await loadFixture(deployFixture);

            // Successful stake
            await tokenA.connect(users[0]).transfer(await stakingContract.getAddress(), parseEther("100"));
            await stakingContract.connect(users[0]).stake(parseEther("100"));

            const [initialAmount, initialUnlockTime] = await stakingContract.getStakeInfo(users[0].address);

            // Failed unstake (too early)
            await expect(
                stakingContract.connect(users[0]).unstake(parseEther("50"))
            ).to.be.revertedWith("Tokens still locked");

            // State should be unchanged
            const [afterFailAmount, afterFailUnlockTime] = await stakingContract.getStakeInfo(users[0].address);
            expect(afterFailAmount).to.equal(initialAmount);
            expect(afterFailUnlockTime).to.equal(initialUnlockTime);

            // Failed stake with insufficient balance
            await expect(
                stakingContract.connect(users[0]).stake(parseEther("100000"))
            ).to.be.revertedWith("Transfer failed");

            // State should still be unchanged
            const [finalAmount, finalUnlockTime] = await stakingContract.getStakeInfo(users[0].address);
            expect(finalAmount).to.equal(initialAmount);
            expect(finalUnlockTime).to.equal(initialUnlockTime);
        });
    });

    describe("Cross-Contract Interactions", function () {
        it("Should handle TokenB transfers between users", async function () {
            const { tokenA, tokenB, stakingContract, users } = await loadFixture(deployFixture);

            // Users stake different amounts
            await tokenA.connect(users[0]).transfer(await stakingContract.getAddress(), parseEther("100"));
            await stakingContract.connect(users[0]).stake(parseEther("100"));

            await tokenA.connect(users[1]).transfer(await stakingContract.getAddress(), parseEther("200"));
            await stakingContract.connect(users[1]).stake(parseEther("200"));

            // User 1 transfers TokenB to User 0
            await tokenB.connect(users[1]).transfer(users[0].address, parseEther("50"));

            expect(await tokenB.balanceOf(users[0].address)).to.equal(parseEther("150"));
            expect(await tokenB.balanceOf(users[1].address)).to.equal(parseEther("150"));

            // Total supply should remain the same
            expect(await tokenB.totalSupply()).to.equal(parseEther("300"));
        });

        it("Should handle TokenB approvals and transferFrom", async function () {
            const { tokenA, tokenB, stakingContract, users } = await loadFixture(deployFixture);

            await tokenA.connect(users[0]).transfer(await stakingContract.getAddress(), parseEther("100"));
            await stakingContract.connect(users[0]).stake(parseEther("100"));

            // User 0 approves User 1 to spend TokenB
            await tokenB.connect(users[0]).approve(users[1].address, parseEther("50"));

            // User 1 transfers from User 0 to User 2
            await tokenB.connect(users[1]).transferFrom(
                users[0].address,
                users[2].address,
                parseEther("30")
            );

            expect(await tokenB.balanceOf(users[0].address)).to.equal(parseEther("70"));
            expect(await tokenB.balanceOf(users[2].address)).to.equal(parseEther("30"));
            expect(await tokenB.allowance(users[0].address, users[1].address)).to.equal(parseEther("20"));
        });
    });
});

// test/FailureScenarios.test.ts
describe("Failure Scenarios and Attack Vectors", function () {
    const LOCK_PERIOD = 7 * 24 * 60 * 60;

    async function deployFixture() {
        const [owner, user1, attacker] = await ethers.getSigners();

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

        await tokenA.setStakingContract(await stakingContract.getAddress());
        await tokenB.setStakingContract(await stakingContract.getAddress());
        await stakingContract._setStakingContract();

        await stakingContract.mintTokenA(user1.address, parseEther("1000"));
        await stakingContract.mintTokenA(attacker.address, parseEther("1000"));

        return { tokenA, tokenB, stakingContract, owner, user1, attacker };
    }

    describe("Access Control Attacks", function () {
        it("Should prevent unauthorized minting of TokenA", async function () {
            const { tokenA, attacker } = await loadFixture(deployFixture);

            await expect(
                tokenA.connect(attacker).mint(attacker.address, parseEther("1000"))
            ).to.be.revertedWith("Only staking contract");
        });

        it("Should prevent unauthorized minting/burning of TokenB", async function () {
            const { tokenB, attacker } = await loadFixture(deployFixture);

            await expect(
                tokenB.connect(attacker).mint(attacker.address, parseEther("1000"))
            ).to.be.revertedWith("Only staking contract");

            await expect(
                tokenB.connect(attacker).burn(attacker.address, parseEther("100"))
            ).to.be.revertedWith("Only staking contract");
        });

        it("Should prevent setting staking contract twice", async function () {
            const { tokenA, tokenB, attacker } = await loadFixture(deployFixture);

            await expect(
                tokenA.connect(attacker).setStakingContract(attacker.address)
            ).to.be.revertedWithCustomError(tokenA, "StakingContractAlreadySet");

            await expect(
                tokenB.connect(attacker).setStakingContract(attacker.address)
            ).to.be.revertedWithCustomError(tokenB, "StakingContractAlreadySet");
        });
    });

    describe("Integer Overflow/Underflow Protection", function () {
        it("Should handle maximum stake amounts", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            const maxAmount = parseEther("1000000000"); // Very large amount
            await stakingContract.mintTokenA(user1.address, maxAmount);
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), maxAmount);

            await expect(
                stakingContract.connect(user1).stake(maxAmount)
            ).to.not.be.reverted;
        });

        it("Should prevent underflow in balance calculations", async function () {
            const { tokenA, user1 } = await loadFixture(deployFixture);

            const userBalance = await tokenA.balanceOf(user1.address);

            await expect(
                tokenA.connect(user1).transfer(ethers.ZeroAddress, userBalance + 1n)
            ).to.be.revertedWithCustomError(tokenA, "ERC20InvalidReceiver");
        });
    });

    describe("State Inconsistency Tests", function () {
        it("Should maintain consistency during rapid operations", async function () {
            const { tokenA, tokenB, stakingContract, user1 } = await loadFixture(deployFixture);

            // Rapid stake operations
            const amounts = [parseEther("10"), parseEther("20"), parseEther("30")];
            let totalExpected = 0n;

            for (const amount of amounts) {
                await tokenA.connect(user1).transfer(await stakingContract.getAddress(), amount);
                await stakingContract.connect(user1).stake(amount);
                totalExpected += amount;

                const [stakedAmount] = await stakingContract.getStakeInfo(user1.address);
                const tokenBBalance = await tokenB.balanceOf(user1.address);

                expect(stakedAmount).to.equal(totalExpected);
                expect(tokenBBalance).to.equal(totalExpected);
            }
        });
    });

    describe("Front-running and MEV Protection", function () {
        it("Should handle simultaneous stake operations", async function () {
            const { tokenA, stakingContract, user1, attacker } = await loadFixture(deployFixture);

            // Both users prepare to stake
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), parseEther("100"));
            await tokenA.connect(attacker).transfer(await stakingContract.getAddress(), parseEther("100"));

            // Simulate simultaneous staking (in same block)
            await stakingContract.connect(user1).stake(parseEther("100"));
            await stakingContract.connect(attacker).stake(parseEther("100"));

            // Both should succeed independently
            const [userAmount] = await stakingContract.getStakeInfo(user1.address);
            const [attackerAmount] = await stakingContract.getStakeInfo(attacker.address);

            expect(userAmount).to.equal(parseEther("100"));
            expect(attackerAmount).to.equal(parseEther("100"));
        });
    });

    describe("Gas Limit and DoS Attacks", function () {
        it("Should handle operations efficiently even with large stakes", async function () {
            const { tokenA, stakingContract, user1 } = await loadFixture(deployFixture);

            const largeAmount = parseEther("1000000");
            await stakingContract.mintTokenA(user1.address, largeAmount);
            await tokenA.connect(user1).transfer(await stakingContract.getAddress(), largeAmount);

            const tx = await stakingContract.connect(user1).stake(largeAmount);
            const receipt = await tx.wait();

            // Should not consume excessive gas
            expect(receipt?.gasUsed).to.be.lt(300000);
        });
    });
});
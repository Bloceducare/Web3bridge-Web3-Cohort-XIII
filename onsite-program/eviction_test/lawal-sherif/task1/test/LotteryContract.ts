const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery Contract Tests", function() {
    let lottery;
    let owner;
    let players;
    const ENTRY_FEE = ethers.parseEther("0.01");

    beforeEach(async function() {
        [owner, ...players] = await ethers.getSigners();
        
        const Lottery = await ethers.getContractFactory("Lottery");
        lottery = await Lottery.deploy();
        await lottery.waitForDeployment();
    });

    describe("Entry Fee Tests", function() {
        it("should allow users to enter with exact 0.01 ETH fee", async function() {
            await expect(
                lottery.connect(players[0]).register("Player1", { value: ENTRY_FEE })
            ).to.not.be.reverted;
        });

        it("should reject entry with less than 0.01 ETH", async function() {
            const lowFee = ethers.parseEther("0.005");
            
            await expect(
                lottery.connect(players[0]).register("Player1", { value: lowFee })
            ).to.be.revertedWith("Must pay exactly 0.01 ETH to enter");
        });

        it("should reject entry with more than 0.01 ETH", async function() {
            const highFee = ethers.parseEther("0.02");
            
            await expect(
                lottery.connect(players[0]).register("Player1", { value: highFee })
            ).to.be.revertedWith("Must pay exactly 0.01 ETH to enter");
        });
    });
    

    describe("Winner Selection Tests", function() {
        it("should only choose winner after exactly 10 players", async function() {
            for (let i = 0; i < 9; i++) {
                await lottery.connect(players[i]).register(`Player${i + 1}`, { value: ENTRY_FEE });
            }

            expect(await lottery.playerCount()).to.equal(9);
            expect(await lottery.currentRound()).to.equal(1);

            await lottery.connect(players[9]).register("Player10", { value: ENTRY_FEE });

            expect(await lottery.playerCount()).to.equal(0);
            expect(await lottery.currentRound()).to.equal(2);
        });

        it("should not allow manual winner selection before 10 players", async function() {
            for (let i = 0; i < 5; i++) {
                await lottery.connect(players[i]).register(`Player${i + 1}`, { value: ENTRY_FEE });
            }

            await expect(
                lottery.connect(owner).selectWinner()
            ).to.be.revertedWith("Need exactly 10 players to select winner");
        });
    });

    describe("Prize Pool Transfer Tests", function() {
        it("should transfer correct prize pool to winner", async function() {
            const expectedPrizePool = ENTRY_FEE * BigInt(10); // 0.1 ETH total
            
            const initialBalances = {};
            for (let i = 0; i < 10; i++) {
                initialBalances[i] = await ethers.provider.getBalance(players[i].address);
            }

            for (let i = 0; i < 10; i++) {
                await lottery.connect(players[i]).register(`Player${i + 1}`, { value: ENTRY_FEE });
            }

            const finalBalances = {};
            for (let i = 0; i < 10; i++) {
                finalBalances[i] = await ethers.provider.getBalance(players[i].address);
            }

            let winnerIndex = -1;
            let winnerGain = BigInt(0);
            
            for (let i = 0; i < 10; i++) {
                const balanceChange = finalBalances[i] - initialBalances[i];
                if (balanceChange > BigInt(0)) {
                    winnerIndex = i;
                    winnerGain = balanceChange;
                    break;
                }
            }

            expect(winnerIndex).to.not.equal(-1, "No winner found");
            
            const expectedGain = expectedPrizePool - ENTRY_FEE; 
            expect(winnerGain).to.be.greaterThan(expectedGain - ethers.parseEther("0.001")); 
        });

        it("should empty contract balance after winner selection", async function() {
            for (let i = 0; i < 10; i++) {
                await lottery.connect(players[i]).register(`Player${i + 1}`, { value: ENTRY_FEE });
            }

            const contractBalance = await ethers.provider.getBalance(lottery.target);
            expect(contractBalance).to.equal(0);
        });
    });

    describe("Lottery Reset Tests", function() {
        it("should reset lottery for next round after winner selection", async function() {
            for (let i = 0; i < 10; i++) {
                await lottery.connect(players[i]).register(`Player${i + 1}`, { value: ENTRY_FEE });
            }

            expect(await lottery.playerCount()).to.equal(0);
            expect(await lottery.currentRound()).to.equal(2);

            const participants = await lottery.getAllParticipants();
            expect(participants.length).to.equal(0);

            await expect(
                lottery.connect(players[0]).register("Player1Round2", { value: ENTRY_FEE })
            ).to.not.be.reverted;

            expect(await lottery.playerCount()).to.equal(1);
        });

        it("should allow same players to join new round", async function() {
            for (let i = 0; i < 10; i++) {
                await lottery.connect(players[i]).register(`Player${i + 1}`, { value: ENTRY_FEE });
            }

            await lottery.connect(players[0]).register("Player1Round2", { value: ENTRY_FEE });
            await lottery.connect(players[1]).register("Player2Round2", { value: ENTRY_FEE });

            expect(await lottery.playerCount()).to.equal(2);
            expect(await lottery.currentRound()).to.equal(2);
        });
    });
});
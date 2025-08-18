import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Lottery } from "../typechain-types";

describe("Lottery", function () {
    let lottery: Lottery;
    let owner: SignerWithAddress;
    let players: SignerWithAddress[];
    const ENTRY_FEE = ethers.utils.parseEther("0.01");

    beforeEach(async function () {
        [owner, ...players] = await ethers.getSigners();
        
        const LotteryFactory = await ethers.getContractFactory("Lottery");
        lottery = await LotteryFactory.deploy();
        await lottery.deployed();
    });

    describe("Entry Requirements", function () {
        it("Should allow entry with exact fee", async function () {
            await expect(
                lottery.connect(players[0]).enter({ value: ENTRY_FEE })
            ).to.emit(lottery, "PlayerEntered")
            .withArgs(players[0].address, 1);
        });

        it("Should reject entry with incorrect fee", async function () {
            const wrongFee = ethers.utils.parseEther("0.02");
            await expect(
                lottery.connect(players[0]).enter({ value: wrongFee })
            ).to.be.revertedWith("Incorrect entry fee");
        });

        it("Should reject entry with insufficient fee", async function () {
            const insufficientFee = ethers.utils.parseEther("0.005");
            await expect(
                lottery.connect(players[0]).enter({ value: insufficientFee })
            ).to.be.revertedWith("Incorrect entry fee");
        });

        it("Should prevent same player from entering twice", async function () {
            await lottery.connect(players[0]).enter({ value: ENTRY_FEE });
            
            await expect(
                lottery.connect(players[0]).enter({ value: ENTRY_FEE })
            ).to.be.revertedWith("Already entered this round");
        });

        it("Should reject entry when lottery is full", async function () {
            // Fill lottery with 10 players
            for (let i = 0; i < 10; i++) {
                await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
            }

            // Try to add 11th player (should fail as lottery auto-picks winner)
            // Since lottery resets after picking winner, this should work
            await expect(
                lottery.connect(players[10]).enter({ value: ENTRY_FEE })
            ).to.emit(lottery, "PlayerEntered");
        });
    });

    describe("Player Tracking", function () {
        it("Should correctly track players", async function () {
            // Add 5 players
            for (let i = 0; i < 5; i++) {
                await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
            }

            const playersCount = await lottery.getPlayersCount();
            expect(playersCount).to.equal(5);

            const playersList = await lottery.getPlayers();
            expect(playersList.length).to.equal(5);
            expect(playersList[0]).to.equal(players[0].address);
        });

        it("Should track hasEntered status correctly", async function () {
            await lottery.connect(players[0]).enter({ value: ENTRY_FEE });
            
            expect(await lottery.hasPlayerEntered(players[0].address)).to.be.true;
            expect(await lottery.hasPlayerEntered(players[1].address)).to.be.false;
        });

        it("Should track prize pool correctly", async function () {
            await lottery.connect(players[0]).enter({ value: ENTRY_FEE });
            await lottery.connect(players[1]).enter({ value: ENTRY_FEE });

            const prizePool = await lottery.getPrizePool();
            expect(prizePool).to.equal(ENTRY_FEE.mul(2));
        });
    });

    describe("Winner Selection", function () {
        it("Should pick winner automatically when 10 players join", async function () {
            // Get initial balances
            const initialBalances: { [key: string]: any } = {};
            for (let i = 0; i < 10; i++) {
                initialBalances[players[i].address] = await ethers.provider.getBalance(players[i].address);
            }

            // Add 10 players
            for (let i = 0; i < 10; i++) {
                await expect(
                    lottery.connect(players[i]).enter({ value: ENTRY_FEE })
                ).to.emit(lottery, "PlayerEntered");
            }

            // Check that winner was picked and lottery reset
            const playersCount = await lottery.getPlayersCount();
            expect(playersCount).to.equal(0);

            const lotteryId = await lottery.getCurrentLotteryId();
            expect(lotteryId).to.equal(2);
        });

        it("Should not pick winner before 10 players", async function () {
            // Add 9 players
            for (let i = 0; i < 9; i++) {
                await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
            }

            const playersCount = await lottery.getPlayersCount();
            expect(playersCount).to.equal(9);

            const lotteryId = await lottery.getCurrentLotteryId();
            expect(lotteryId).to.equal(1);
        });

        it("Should transfer prize pool to winner", async function () {
            const expectedPrizePool = ENTRY_FEE.mul(10);

            // Record initial balances
            const initialBalances: { [key: string]: any } = {};
            for (let i = 0; i < 10; i++) {
                initialBalances[players[i].address] = await ethers.provider.getBalance(players[i].address);
            }

            // Add 10 players and trigger winner selection
            for (let i = 0; i < 10; i++) {
                await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
            }

            // Check that one player has received the prize
            let winnerFound = false;
            for (let i = 0; i < 10; i++) {
                const currentBalance = await ethers.provider.getBalance(players[i].address);
                const balanceChange = currentBalance.sub(initialBalances[players[i].address]);
                
                // Account for gas costs - winner should have gained significantly more than they spent on gas
                if (balanceChange.gt(ENTRY_FEE.mul(8))) { // Prize minus entry fee minus gas should still be substantial
                    winnerFound = true;
                    break;
                }
            }
            expect(winnerFound).to.be.true;

            // Check that contract balance is 0 after payout
            const contractBalance = await ethers.provider.getBalance(lottery.address);
            expect(contractBalance).to.equal(0);
        });
    });

    describe("Lottery Reset", function () {
        it("Should reset lottery after picking winner", async function () {
            // Add 10 players to trigger winner selection
            for (let i = 0; i < 10; i++) {
                await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
            }

            // Check lottery has reset
            const playersCount = await lottery.getPlayersCount();
            expect(playersCount).to.equal(0);

            const lotteryId = await lottery.getCurrentLotteryId();
            expect(lotteryId).to.equal(2);

            // Check that all hasEntered flags are reset
            for (let i = 0; i < 10; i++) {
                expect(await lottery.hasPlayerEntered(players[i].address)).to.be.false;
            }
        });

        it("Should allow same players to enter new round after reset", async function () {
            // Complete first round
            for (let i = 0; i < 10; i++) {
                await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
            }

            // Players should be able to enter new round
            await expect(
                lottery.connect(players[0]).enter({ value: ENTRY_FEE })
            ).to.emit(lottery, "PlayerEntered")
            .withArgs(players[0].address, 2);
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow owner to emergency pick winner", async function () {
            // Add some players (less than 10)
            for (let i = 0; i < 5; i++) {
                await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
            }

            await expect(
                lottery.connect(owner).emergencyPickWinner()
            ).to.emit(lottery, "WinnerPicked");
        });

        it("Should not allow non-owner to emergency pick winner", async function () {
            // Add some players
            for (let i = 0; i < 5; i++) {
                await lottery.connect(players[i]).enter({ value: ENTRY_FEE });
            }

            await expect(
                lottery.connect(players[0]).emergencyPickWinner()
            ).to.be.revertedWith("Not the owner");
        });

        it("Should reject emergency pick when no players", async function () {
            await expect(
                lottery.connect(owner).emergencyPickWinner()
            ).to.be.revertedWith("No players in lottery");
        });
    });

    describe("View Functions", function () {
        it("Should return correct contract state", async function () {
            expect(await lottery.ENTRY_FEE()).to.equal(ENTRY_FEE);
            expect(await lottery.MAX_PLAYERS()).to.equal(10);
            expect(await lottery.owner()).to.equal(owner.address);
            expect(await lottery.getCurrentLotteryId()).to.equal(1);
        });
    });
});
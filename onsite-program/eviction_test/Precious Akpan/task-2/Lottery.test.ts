import {expect} from "chai"
import { ethers } from "hardhat";

describe("Lottery", function () {
    let lottery;
    let owner;
    let addr1;
    let addr2;
    let addrs;
    const entryFee = ethers.parseEther("0.01");

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        const Lottery = await ethers.getContractFactory("Lottery");
        lottery = await Lottery.deploy(entryFee);
        // await lottery.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await lottery.owner()).to.equal(owner.address);
        });

        it("Should set the right entry fee", async function () {
            expect(await lottery.entryFee()).to.equal(entryFee);
        });
    });

    describe("Entering the lottery", function () {
        it("Should allow a player to enter", async function () {
            await lottery.connect(addr1).enter({ value: entryFee });
            const players = await lottery.getPlayers();
            expect(players).to.include(addr1.address);
        });

        it("Should not allow a player to enter with incorrect entry fee", async function () {
            await expect(lottery.connect(addr1).enter({ value: ethers.parseEther("0.001") })).to.be.revertedWith("Lottery: Must submit exact entry fee");
        });

        it("Should not allow a player to enter twice", async function () {
            await lottery.connect(addr1).enter({ value: entryFee });
            await expect(lottery.connect(addr1).enter({ value: entryFee })).to.be.revertedWith("Lottery: Player already entered");
        });

        it("Should emit PlayerEntered event", async function () {
            await expect(lottery.connect(addr1).enter({ value: entryFee }))
                .to.emit(lottery, "PlayerEntered")
                .withArgs(addr1.address);
        });
    });

    describe("Picking a winner", function () {
        it("Should pick a winner when 10 players have entered", async function () {
            for (let i = 0; i < 10; i++) {
                await lottery.connect(addrs[i]).enter({ value: entryFee });
            }
            const winner = await lottery.winner();
            expect(winner).to.not.equal(ethers.ZeroAddress);
        });

        it("Should reset the lottery after a winner is picked", async function () {
            for (let i = 0; i < 10; i++) {
                await lottery.connect(addrs[i]).enter({ value: entryFee });
            }
            await lottery.connect(addrs[10]).enter({ value: entryFee });
            const players = await lottery.getPlayers();
            expect(players.length).to.equal(1);
        });
    });
});

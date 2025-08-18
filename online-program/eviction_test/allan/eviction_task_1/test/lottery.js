const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Lottery", function () {
	const ENTRY = ethers.parseEther("0.01");

	async function deployFixture() {
		const Lottery = await ethers.getContractFactory("Lottery");
		const lottery = await Lottery.deploy();
		await lottery.waitForDeployment();
		const [deployer, ...players] = await ethers.getSigners();
		return { lottery, deployer, players };
	}

	it("requires exact fee", async function () {
		const { lottery, players } = await deployFixture();
		await expect(lottery.connect(players[0]).enter({ value: 0n }))
			.to.be.revertedWith("Incorrect entry fee");
		await expect(lottery.connect(players[0]).enter({ value: ENTRY - 1n }))
			.to.be.revertedWith("Incorrect entry fee");
		await expect(lottery.connect(players[0]).enter({ value: ENTRY + 1n }))
			.to.be.revertedWith("Incorrect entry fee");
	});

	it("tracks players and prevents double entry", async function () {
		const { lottery, players } = await deployFixture();
		for (let i = 0; i < 9; i++) {
			await lottery.connect(players[i]).enter({ value: ENTRY });
		}
		const current = await lottery.getPlayers();
		expect(current.length).to.equal(9);
		await expect(lottery.connect(players[0]).enter({ value: ENTRY }))
			.to.be.revertedWith("Already entered");
	});

	it("only after 10 players, a winner is chosen and pool is paid out", async function () {
		const { lottery, players } = await deployFixture();
		const contractAddress = await lottery.getAddress();

		for (let i = 0; i < 9; i++) {
			await lottery.connect(players[i]).enter({ value: ENTRY });
		}

		let bal = await ethers.provider.getBalance(contractAddress);
		expect(bal).to.equal(ENTRY * 9n);
		expect(await lottery.lastWinner()).to.equal(ethers.ZeroAddress);

		const tx = await lottery.connect(players[9]).enter({ value: ENTRY });
		await expect(tx)
			.to.emit(lottery, "WinnerSelected")
			.withArgs(0, anyValue, ENTRY * 10n);

		bal = await ethers.provider.getBalance(contractAddress);
		expect(bal).to.equal(0n);
		expect(await lottery.lastWinner()).to.not.equal(ethers.ZeroAddress);
	});

	it("resets for the next round", async function () {
		const { lottery, players } = await deployFixture();

		for (let i = 0; i < 10; i++) {
			await lottery.connect(players[i]).enter({ value: ENTRY });
		}

		const currentAfter = await lottery.getPlayers();
		expect(currentAfter.length).to.equal(0);

		await lottery.connect(players[0]).enter({ value: ENTRY });
		const currentRound2 = await lottery.getPlayers();
		expect(currentRound2.length).to.equal(1);
	});
}); 
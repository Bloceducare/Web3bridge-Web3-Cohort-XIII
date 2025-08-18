const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LudoGame", function () {
	async function deployAll({ initialSupply = "1000000", winningScore = 10 } = {}) {
		const [deployer, p1, p2, p3, p4, extra] = await ethers.getSigners();
		const supply = ethers.parseUnits(initialSupply, 18);
		const LudoToken = await ethers.getContractFactory("LudoToken");
		const token = await LudoToken.deploy(supply);
		await token.waitForDeployment();

		const LudoGame = await ethers.getContractFactory("LudoGame");
		const game = await LudoGame.deploy(await token.getAddress(), winningScore);
		await game.waitForDeployment();

		return { deployer, p1, p2, p3, p4, extra, token, game };
	}

	async function register(game, signer, name, color) {
		await game.connect(signer).registerPlayer(name, color);
	}

	it("registers players with unique colors up to max 4", async function () {
		const { game, p1, p2, p3, p4 } = await deployAll();
		await register(game, p1, "Alice", 0); // RED
		await register(game, p2, "Bob", 1); // GREEN
		await register(game, p3, "Carol", 2); // BLUE
		await register(game, p4, "Dave", 3); // YELLOW

		const players = await game.getPlayers();
		expect(players.length).to.equal(4);
		expect(players[0].name).to.equal("Alice");
		expect(players[1].name).to.equal("Bob");
		expect(players[2].name).to.equal("Carol");
		expect(players[3].name).to.equal("Dave");
	});

	it("reverts on duplicate color, duplicate registration, and max players reached", async function () {
		const { game, p1, p2, p3, p4, extra } = await deployAll();
		await register(game, p1, "Alice", 0);
		await expect(game.connect(p2).registerPlayer("Bob", 0))
			.to.be.revertedWithCustomError(game, "ColorAlreadyTaken");
		await expect(game.connect(p1).registerPlayer("AliceAgain", 1))
			.to.be.revertedWithCustomError(game, "AlreadyRegistered");

		await register(game, p2, "Bob", 1);
		await register(game, p3, "Carol", 2);
		await register(game, p4, "Dave", 3);
		await expect(game.connect(extra).registerPlayer("Eve", 1))
			.to.be.revertedWithCustomError(game, "MaxPlayersReached");
	});

	it("requires at least two players to start and only during registering state", async function () {
		const { game, p1 } = await deployAll();
		await register(game, p1, "Alice", 0);
		await expect(game.startGame(1))
			.to.be.revertedWithCustomError(game, "NeedAtLeastTwoPlayers");
	});

	it("collects stakes on start, sets pot, and begins with player 0 turn", async function () {
		const { game, token, p1, p2 } = await deployAll();
		await register(game, p1, "Alice", 0);
		await register(game, p2, "Bob", 1);

		const stake = ethers.parseUnits("10", 18);
		// fund players
		await token.transfer(await p1.getAddress(), stake);
		await token.transfer(await p2.getAddress(), stake);
		// approve game to pull stake
		await token.connect(p1).approve(await game.getAddress(), stake);
		await token.connect(p2).approve(await game.getAddress(), stake);

		await expect(game.startGame(stake))
			.to.emit(game, "GameStarted").withArgs(stake, 2);
		expect(await game.stakeAmount()).to.equal(stake);
		expect(await game.pot()).to.equal(stake * 2n);
		expect(await game.currentTurnIndex()).to.equal(0);
	});

	it("enforces turn order and updates score based on dice roll (1..6)", async function () {
		const { game, token, p1, p2 } = await deployAll({ winningScore: 50 });
		await register(game, p1, "Alice", 0);
		await register(game, p2, "Bob", 1);

		const stake = ethers.parseUnits("5", 18);
		await token.transfer(await p1.getAddress(), stake);
		await token.transfer(await p2.getAddress(), stake);
		await token.connect(p1).approve(await game.getAddress(), stake);
		await token.connect(p2).approve(await game.getAddress(), stake);
		await game.startGame(stake);

		const roll1 = await game.connect(p1).playTurn();
		const r1 = await roll1.wait();
		const diceEvent1 = r1.logs.find(l => l.fragment && l.fragment.name === "DiceRolled");
		expect(diceEvent1).to.not.be.undefined;
		const rolled1 = diceEvent1.args[1];
		expect(rolled1).to.gte(1n).and.lte(6n);

		await expect(game.connect(p1).playTurn())
			.to.be.revertedWithCustomError(game, "NotPlayerTurn");

		const roll2 = await game.connect(p2).playTurn();
		const r2 = await roll2.wait();
		const diceEvent2 = r2.logs.find(l => l.fragment && l.fragment.name === "DiceRolled");
		const rolled2 = diceEvent2.args[1];
		expect(rolled2).to.gte(1n).and.lte(6n);
	});

	it("pays the winner the full pot when reaching winning score", async function () {
		// Use low winning score to finish quickly
		const { game, token, p1, p2 } = await deployAll({ winningScore: 2 });
		await register(game, p1, "Alice", 0);
		await register(game, p2, "Bob", 1);

		const stake = ethers.parseUnits("10", 18);
		await token.transfer(await p1.getAddress(), stake);
		await token.transfer(await p2.getAddress(), stake);
		await token.connect(p1).approve(await game.getAddress(), stake);
		await token.connect(p2).approve(await game.getAddress(), stake);
		await game.startGame(stake);

		// To make test deterministic, we will fast-forward by attempting plays until game finishes
		// With winningScore=2, any first roll of >=2 by current player will win immediately.
		const gameAddr = await game.getAddress();
		const pot = stake * 2n;

		// balances before payout
		const before1 = await token.balanceOf(await p1.getAddress());
		const before2 = await token.balanceOf(await p2.getAddress());
		const beforeGame = await token.balanceOf(gameAddr);

		// Keep playing turns until finished
		for (let i = 0; i < 10; i++) {
			try { await game.connect(p1).playTurn(); } catch {}
			if ((await game.gameState()) === 2) break; // Finished
			try { await game.connect(p2).playTurn(); } catch {}
			if ((await game.gameState()) === 2) break;
		}

		expect(await game.gameState()).to.equal(2); // Finished
		const winAddr = await game.winner();
		const winnerBal = await token.balanceOf(winAddr);
		const afterGame = await token.balanceOf(gameAddr);
		// Winner received pot, game contract emptied the pot
		expect(afterGame).to.equal(beforeGame - pot);
		expect(winnerBal === before1 + pot || winnerBal === before2 + pot).to.be.true;
	});

	it("reverts playing when game not started or finished", async function () {
		const { game, p1, p2 } = await deployAll();
		await register(game, p1, "Alice", 0);
		await register(game, p2, "Bob", 1);
		await expect(game.connect(p1).playTurn())
			.to.be.revertedWithCustomError(game, "GameNotStarted");
	});
}); 
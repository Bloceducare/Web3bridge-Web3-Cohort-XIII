import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame, MockToken } from "../typechain-types";

describe("LudoGame", function () {
  let token: MockToken;
  let ludoGame: LudoGame;
  let owner: any, player1: any, player2: any, player3: any;
  const STAKE_AMOUNT = ethers.parseEther("10"); // each player stakes 10 tokens

  beforeEach(async () => {
    [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy mock token
    const Token = await ethers.getContractFactory("MockToken");
    token = (await Token.deploy(ethers.parseEther("1000"))) as MockToken;
    await token.waitForDeployment();

    // Deploy LudoGame
    const Ludo = await ethers.getContractFactory("LudoGame");
    ludoGame = (await Ludo.deploy(
      await token.getAddress(),
      STAKE_AMOUNT
    )) as LudoGame;
    await ludoGame.waitForDeployment();

    // Distribute tokens to players
    await token.transfer(player1.address, STAKE_AMOUNT);
    await token.transfer(player2.address, STAKE_AMOUNT);
    await token.transfer(player3.address, STAKE_AMOUNT);
  });

  it("should allow players to register", async () => {
    // Approve tokens
    await token
      .connect(player1)
      .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoGame.connect(player1).register("Alice", 0); // RED

    await token
      .connect(player2)
      .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoGame.connect(player2).register("Bob", 1); // GREEN

    const players = await ludoGame.getPlayers();
    expect(players.length).to.equal(2);
    expect(players[0].name).to.equal("Alice");
    expect(players[1].name).to.equal("Bob");
  });

  it("should start the game with 2+ players", async () => {
    await token
      .connect(player1)
      .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoGame.connect(player1).register("Alice", 0);

    await token
      .connect(player2)
      .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoGame.connect(player2).register("Bob", 1);

    await ludoGame.startGame();
    expect(await ludoGame.gameStarted()).to.equal(true);
  });

  it("should enforce turns", async () => {
    await token
      .connect(player1)
      .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoGame.connect(player1).register("Alice", 0);

    await token
      .connect(player2)
      .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoGame.connect(player2).register("Bob", 1);

    await ludoGame.startGame();

    // Player1 rolls
    const roll1 = await ludoGame.connect(player1).rollDice();
    expect(roll1).to.not.equal(0);

    // Player1 cannot roll again immediately
    await expect(ludoGame.connect(player1).rollDice()).to.be.revertedWith(
      "Not your turn"
    );

    // Player2 can roll
    const roll2 = await ludoGame.connect(player2).rollDice();
    expect(roll2).to.not.equal(0);
  });

  it("should declare a winner and transfer prize pool", async () => {
    await token
      .connect(player1)
      .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoGame.connect(player1).register("Alice", 0);

    await token
      .connect(player2)
      .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoGame.connect(player2).register("Bob", 1);

    await ludoGame.startGame();

    // Simulate player1 winning by manually rolling until position >= 100
    for (let i = 0; i < 30; i++) {
      if ((await ludoGame.winner()) !== ethers.ZeroAddress) break;
      if ((await ludoGame.currentTurn()) === player1.address) {
        await ludoGame.connect(player1).rollDice();
      } else {
        await ludoGame.connect(player2).rollDice();
      }
    }

    const gameWinner = await ludoGame.winner();
    expect(gameWinner).to.not.equal(ethers.ZeroAddress);

    const balance = await token.balanceOf(gameWinner);
    expect(balance).to.be.greaterThanOrEqual(STAKE_AMOUNT * 2n);
  });
});

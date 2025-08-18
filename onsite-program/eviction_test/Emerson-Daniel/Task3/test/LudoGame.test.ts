import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame, GameToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("LudoGame", function () {
  let ludoGame: LudoGame;
  let gameToken: GameToken;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;
  let player4: SignerWithAddress;
  
  const STAKE_AMOUNT = ethers.utils.parseEther("10");
  const INITIAL_SUPPLY = 1000000;

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // Deploy GameToken
    const GameTokenFactory = await ethers.getContractFactory("GameToken");
    gameToken = await GameTokenFactory.deploy(INITIAL_SUPPLY);
    await gameToken.deployed();

    // Deploy LudoGame
    const LudoGameFactory = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGameFactory.deploy(gameToken.address);
    await ludoGame.deployed();

    // Mint tokens to players for testing
    for (const player of [player1, player2, player3, player4]) {
      await gameToken.mint(player.address, ethers.utils.parseEther("100"));
    }
  });

  describe("Player Registration", function () {
    it("Should allow player registration with valid data", async function () {
      await expect(ludoGame.connect(player1).registerPlayer("Alice", 0)) // RED
        .to.emit(ludoGame, "PlayerRegistered")
        .withArgs(player1.address, "Alice", 0);

      const playerInfo = await ludoGame.getPlayerInfo(player1.address);
      expect(playerInfo.name).to.equal("Alice");
      expect(playerInfo.color).to.equal(0); // RED
      expect(playerInfo.isRegistered).to.be.true;
    });

    it("Should prevent duplicate registration", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      
      await expect(
        ludoGame.connect(player1).registerPlayer("Alice2", 1)
      ).to.be.revertedWith("Already registered");
    });

    it("Should prevent duplicate color selection", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0); // RED
      
      await expect(
        ludoGame.connect(player2).registerPlayer("Bob", 0) // RED again
      ).to.be.revertedWith("Color already taken");
    });

    it("Should prevent registration with empty name", async function () {
      await expect(
        ludoGame.connect(player1).registerPlayer("", 0)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should limit to maximum 4 players", async function () {
      // Register 4 players
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      await ludoGame.connect(player2).registerPlayer("Bob", 1);
      await ludoGame.connect(player3).registerPlayer("Charlie", 2);
      await ludoGame.connect(player4).registerPlayer("David", 3);

      // Try to register 5th player with any available color
      const [, , , , , player5] = await ethers.getSigners();
      await expect(
        ludoGame.connect(player5).registerPlayer("Eve", 0)
      ).to.be.revertedWith("Game is full");
    });
  });

  describe("Token Staking", function () {
    beforeEach(async function () {
      // Register players
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      await ludoGame.connect(player2).registerPlayer("Bob", 1);
    });

    it("Should allow registered players to stake tokens", async function () {
      // Approve tokens first
      await gameToken.connect(player1).approve(ludoGame.address, STAKE_AMOUNT);

      await expect(ludoGame.connect(player1).stakeTokens())
        .to.emit(ludoGame, "PlayerStaked")
        .withArgs(player1.address, STAKE_AMOUNT);

      const playerInfo = await ludoGame.getPlayerInfo(player1.address);
      expect(playerInfo.hasStaked).to.be.true;
    });

    it("Should prevent non-registered players from staking", async function () {
      await gameToken.connect(player3).approve(ludoGame.address, STAKE_AMOUNT);

      await expect(
        ludoGame.connect(player3).stakeTokens()
      ).to.be.revertedWith("Player not registered");
    });

    it("Should prevent double staking", async function () {
      await gameToken.connect(player1).approve(ludoGame.address, STAKE_AMOUNT.mul(2));
      await ludoGame.connect(player1).stakeTokens();

      await expect(
        ludoGame.connect(player1).stakeTokens()
      ).to.be.revertedWith("Already staked");
    });
  });

  describe("Game Flow", function () {
    beforeEach(async function () {
      // Register and stake for 2 players
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      await ludoGame.connect(player2).registerPlayer("Bob", 1);
      
      await gameToken.connect(player1).approve(ludoGame.address, STAKE_AMOUNT);
      await gameToken.connect(player2).approve(ludoGame.address, STAKE_AMOUNT);
      
      await ludoGame.connect(player1).stakeTokens();
    });

    it("Should start game when all players have staked", async function () {
      await expect(ludoGame.connect(player2).stakeTokens())
        .to.emit(ludoGame, "GameStarted");

      const gameInfo = await ludoGame.getGameInfo();
      expect(gameInfo.state).to.equal(1); // ACTIVE
    });

    it("Should allow current player to roll dice", async function () {
      await ludoGame.connect(player2).stakeTokens(); // Start game
      
      const currentPlayer = await ludoGame.getCurrentPlayer();
      const playerSigner = currentPlayer === player1.address ? player1 : player2;
      
      await expect(ludoGame.connect(playerSigner).rollDice())
        .to.emit(ludoGame, "DiceRolled");
    });

    it("Should prevent non-current player from rolling dice", async function () {
      await ludoGame.connect(player2).stakeTokens(); // Start game
      
      const currentPlayer = await ludoGame.getCurrentPlayer();
      const nonCurrentPlayer = currentPlayer === player1.address ? player2 : player1;
      
      await expect(
        ludoGame.connect(nonCurrentPlayer).rollDice()
      ).to.be.revertedWith("Not your turn");
    });
  });

  describe("Game Information", function () {
    it("Should return correct game information", async function () {
      const gameInfo = await ludoGame.getGameInfo();
      expect(gameInfo.state).to.equal(0); // WAITING
      expect(gameInfo.playersCount).to.equal(0);
      expect(gameInfo.stakedAmount).to.equal(0);
    });

    it("Should return correct player information", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      
      const playerInfo = await ludoGame.getPlayerInfo(player1.address);
      expect(playerInfo.name).to.equal("Alice");
      expect(playerInfo.color).to.equal(0);
      expect(playerInfo.score).to.equal(0);
      expect(playerInfo.position).to.equal(0);
      expect(playerInfo.isRegistered).to.be.true;
      expect(playerInfo.hasStaked).to.be.false;
    });
  });
});

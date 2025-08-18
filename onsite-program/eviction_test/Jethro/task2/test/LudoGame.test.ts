// test/LudoGame.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";

describe("LudoGame Contract", function () {
  let LudoGame: any;
  let ludoGame: Contract;
  let owner: Signer;
  let player1: Signer;
  let player2: Signer;
  let player3: Signer;
  let player4: Signer;
  const STAKE_AMOUNT: BigNumber = ethers.utils.parseEther("0.01");

  beforeEach(async function () {
    // Get signers
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // Deploy the contract
    LudoGame = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGame.deploy();
    await ludoGame.deployed();
  });

  describe("Player Registration", function () {
    it("should allow a player to register", async function () {
      await ludoGame.connect(player1).registerPlayer("Player1", 0); // RED
      const playerInfo = await ludoGame.getPlayerInfo(await player1.getAddress());
      expect(playerInfo.isRegistered).to.be.true;
      expect(playerInfo.name).to.equal("Player1");
      expect(playerInfo.color).to.equal(0); // RED
    });

    it("should revert if player is already registered", async function () {
      await ludoGame.connect(player1).registerPlayer("Player1", 0);
      await expect(
        ludoGame.connect(player1).registerPlayer("Player1", 0)
      ).to.be.revertedWith("Player already registered");
    });

    it("should revert if invalid color is provided", async function () {
      await expect(
        ludoGame.connect(player1).registerPlayer("Player1", 4)
      ).to.be.revertedWith("Invalid color");
    });

    it("should revert if name is empty", async function () {
      await expect(
        ludoGame.connect(player1).registerPlayer("", 0)
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Game Creation", function () {
    it("should allow a registered player to create a game", async function () {
      await ludoGame.connect(player1).registerPlayer("Player1", 0);
      const tx = await ludoGame.connect(player1).createGame();
      const receipt = await tx.wait();
      const gameId = receipt.events[0].args.gameId;
      const gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.gameId).to.equal(gameId);
      expect(gameInfo.state).to.equal(0); // WAITING
    });

    it("should revert if unregistered player tries to create a game", async function () {
      await expect(ludoGame.connect(player1).createGame()).to.be.revertedWith(
        "Player not registered"
      );
    });

    it("should revert if player is already in an active game", async function () {
      await ludoGame.connect(player1).registerPlayer("Player1", 0);
      await ludoGame.connect(player1).createGame();
      await expect(ludoGame.connect(player1).createGame()).to.be.revertedWith(
        "Player already in active game"
      );
    });
  });

  describe("Joining a Game", function () {
    let gameId: BigNumber;

    beforeEach(async function () {
      await ludoGame.connect(player1).registerPlayer("Player1", 0); // RED
      await ludoGame.connect(player2).registerPlayer("Player2", 1); // GREEN
      await ludoGame.connect(player3).registerPlayer("Player3", 2); // BLUE
      await ludoGame.connect(player4).registerPlayer("Player4", 3); // YELLOW
      const tx = await ludoGame.connect(player1).createGame();
      const receipt = await tx.wait();
      gameId = receipt.events[0].args.gameId;
    });

    it("should allow players to join a game with correct stake", async function () {
      await ludoGame
        .connect(player1)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player2)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      const gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.playerCount).to.equal(2);
      expect(gameInfo.prizePool).to.equal(STAKE_AMOUNT.mul(2));
    });

    it("should start the game when 4 players join", async function () {
      await ludoGame
        .connect(player1)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player2)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player3)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player4)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      const gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.state).to.equal(1); // ACTIVE
      expect(gameInfo.playerCount).to.equal(4);
    });

    it("should revert if incorrect stake amount is sent", async function () {
      await expect(
        ludoGame
          .connect(player1)
          .joinGame(gameId, { value: ethers.utils.parseEther("0.02") })
      ).to.be.revertedWith("Incorrect stake amount");
    });

    it("should revert if color is already taken", async function () {
      await ludoGame.connect(player1).registerPlayer("Player1Duplicate", 0); // RED again
      await ludoGame
        .connect(player1)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await expect(
        ludoGame
          .connect(player1)
          .joinGame(gameId, { value: STAKE_AMOUNT })
      ).to.be.revertedWith("Color already taken");
    });

    it("should revert if game is full", async function () {
      await ludoGame
        .connect(player1)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player2)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player3)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player4)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await expect(
        ludoGame
          .connect(player1)
          .joinGame(gameId, { value: STAKE_AMOUNT })
      ).to.be.revertedWith("Game is full");
    });
  });

  describe("Gameplay", function () {
    let gameId: BigNumber;

    beforeEach(async function () {
      // Register players
      await ludoGame.connect(player1).registerPlayer("Player1", 0); // RED
      await ludoGame.connect(player2).registerPlayer("Player2", 1); // GREEN
      await ludoGame.connect(player3).registerPlayer("Player3", 2); // BLUE
      await ludoGame.connect(player4).registerPlayer("Player4", 3); // YELLOW

      // Create and join game
      const tx = await ludoGame.connect(player1).createGame();
      const receipt = await tx.wait();
      gameId = receipt.events[0].args.gameId;

      await ludoGame
        .connect(player1)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player2)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player3)
        .joinGame(gameId, { value: STAKE_AMOUNT });
      await ludoGame
        .connect(player4)
        .joinGame(gameId, { value: STAKE_AMOUNT });
    });

    it("should allow players to roll dice and move", async function () {
      await ludoGame.connect(player1).rollDiceAndMove(gameId);
      const playerInfo = await ludoGame.getPlayerInGame(gameId, 0);
      expect(playerInfo.position).to.be
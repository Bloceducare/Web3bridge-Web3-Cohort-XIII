import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame, LudoToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("LudoGame", function () {
  let ludoToken: LudoToken;
  let ludoGame: LudoGame;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;
  let player3: HardhatEthersSigner;
  let player4: HardhatEthersSigner;

  const INITIAL_SUPPLY = 1000000;
  const STAKE_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    player1 = signers[1];
    player2 = signers[2];
    player3 = signers[3];
    player4 = signers[4];

    const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
    ludoToken = await LudoTokenFactory.deploy(INITIAL_SUPPLY);

    const LudoGameFactory = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGameFactory.deploy(await ludoToken.getAddress());

    await ludoToken.transfer(player1.address, ethers.parseEther("1000"));
    await ludoToken.transfer(player2.address, ethers.parseEther("1000"));
    await ludoToken.transfer(player3.address, ethers.parseEther("1000"));
    await ludoToken.transfer(player4.address, ethers.parseEther("1000"));
  });

  describe("Token Contract", function () {
    it("Should deploy with correct initial supply", async function () {
      const totalSupply = await ludoToken.totalSupply();
      expect(totalSupply).to.equal(
        ethers.parseEther(INITIAL_SUPPLY.toString())
      );
    });

    it("Should transfer tokens correctly", async function () {
      const amount = ethers.parseEther("100");
      await ludoToken.transfer(player1.address, amount);
      const balance = await ludoToken.balanceOf(player1.address);
      expect(balance).to.be.gte(amount);
    });

    it("Should approve and transferFrom correctly", async function () {
      const amount = ethers.parseEther("100");
      await ludoToken.connect(player1).approve(player2.address, amount);
      const allowance = await ludoToken.allowance(
        player1.address,
        player2.address
      );
      expect(allowance).to.equal(amount);
    });
  });

  describe("Game Creation", function () {
    it("Should create a new game", async function () {
      const tx = await ludoGame.createGame(STAKE_AMOUNT);
      await tx.wait();

      const gameInfo = await ludoGame.getGameInfo(1);
      expect(gameInfo.gameId_).to.equal(1);
      expect(gameInfo.stakeAmount).to.equal(STAKE_AMOUNT);
      expect(gameInfo.state).to.equal(0);
    });

    it("Should not create game with zero stake", async function () {
      await expect(ludoGame.createGame(0)).to.be.revertedWithCustomError(
        ludoGame,
        "InvalidStakeAmount"
      );
    });
  });

  describe("Player Registration", function () {
    let gameId: number;

    beforeEach(async function () {
      const tx = await ludoGame.createGame(STAKE_AMOUNT);
      await tx.wait();
      gameId = 1;
    });

    it("Should register a player successfully", async function () {
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);

      const playerInfo = await ludoGame.getPlayerInfo(gameId, 0);
      expect(playerInfo.playerAddress).to.equal(player1.address);
      expect(playerInfo.name).to.equal("Player1");
      expect(playerInfo.color).to.equal(0);
      expect(playerInfo.isRegistered).to.be.true;
    });

    it("Should not register player with same color", async function () {
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await expect(
        ludoGame.connect(player2).registerPlayer(gameId, "Player2", 0)
      ).to.be.revertedWithCustomError(ludoGame, "ColorAlreadyTaken");
    });

    it("Should not register more than 4 players", async function () {
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Player2", 1);
      await ludoGame.connect(player3).registerPlayer(gameId, "Player3", 2);
      await ludoGame.connect(player4).registerPlayer(gameId, "Player4", 3);

      const player5 = (await ethers.getSigners())[5];
      await expect(
        ludoGame.connect(player5).registerPlayer(gameId, "Player5", 0)
      ).to.be.revertedWithCustomError(ludoGame, "GameIsFull");
    });

    it("Should not register player with empty name", async function () {
      await expect(
        ludoGame.connect(player1).registerPlayer(gameId, "", 0)
      ).to.be.revertedWithCustomError(ludoGame, "EmptyName");
    });
  });

  describe("Token Staking", function () {
    let gameId: number;

    beforeEach(async function () {
      const tx = await ludoGame.createGame(STAKE_AMOUNT);
      await tx.wait();
      gameId = 1;

      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Player2", 1);
    });

    it("Should stake tokens successfully", async function () {
      await ludoToken
        .connect(player1)
        .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
      await ludoGame.connect(player1).stakeTokens(gameId);

      const playerInfo = await ludoGame.getPlayerInfo(gameId, 0);
      expect(playerInfo.hasStaked).to.be.true;
    });

    it("Should start game when all players stake", async function () {
      await ludoToken
        .connect(player1)
        .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
      await ludoToken
        .connect(player2)
        .approve(await ludoGame.getAddress(), STAKE_AMOUNT);

      await ludoGame.connect(player1).stakeTokens(gameId);
      await ludoGame.connect(player2).stakeTokens(gameId);

      const gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.state).to.equal(1);
      expect(gameInfo.totalPrize).to.equal(STAKE_AMOUNT * 2n);
    });

    it("Should not stake without approval", async function () {
      await expect(
        ludoGame.connect(player1).stakeTokens(gameId)
      ).to.be.revertedWithCustomError(ludoToken, "InsufficientAllowance");
    });
  });

  describe("Game Play", function () {
    let gameId: number;

    beforeEach(async function () {
      const tx = await ludoGame.createGame(STAKE_AMOUNT);
      await tx.wait();
      gameId = 1;

      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Player2", 1);

      await ludoToken
        .connect(player1)
        .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
      await ludoToken
        .connect(player2)
        .approve(await ludoGame.getAddress(), STAKE_AMOUNT);

      await ludoGame.connect(player1).stakeTokens(gameId);
      await ludoGame.connect(player2).stakeTokens(gameId);
    });

    it("Should roll dice successfully", async function () {
      const diceValue = await ludoGame
        .connect(player1)
        .rollDice.staticCall(gameId);
      expect(diceValue).to.be.gte(1);
      expect(diceValue).to.be.lte(6);
    });

    it("Should not allow non-current player to roll dice", async function () {
      await expect(
        ludoGame.connect(player2).rollDice(gameId)
      ).to.be.revertedWithCustomError(ludoGame, "NotPlayerTurn");
    });

    it("Should make move successfully", async function () {
      const diceValue = 3;
      await ludoGame.connect(player1).makeMove(gameId, diceValue);

      const playerInfo = await ludoGame.getPlayerInfo(gameId, 0);
      expect(playerInfo.position).to.equal(diceValue);
      expect(playerInfo.score).to.equal(diceValue);
    });

    it("Should switch turns after move", async function () {
      await ludoGame.connect(player1).makeMove(gameId, 3);

      const currentPlayer = await ludoGame.getCurrentPlayer(gameId);
      expect(currentPlayer).to.equal(player2.address);
    });

    it("Should not make move with invalid dice value", async function () {
      await expect(
        ludoGame.connect(player1).makeMove(gameId, 7)
      ).to.be.revertedWithCustomError(ludoGame, "InvalidDiceValue");

      await expect(
        ludoGame.connect(player1).makeMove(gameId, 0)
      ).to.be.revertedWithCustomError(ludoGame, "InvalidDiceValue");
    });

    it("Should finish game when player reaches winning position", async function () {
      const player1InitialBalance = await ludoToken.balanceOf(player1.address);

      await ludoGame.connect(player1).makeMove(gameId, 6);
      await ludoGame.connect(player2).makeMove(gameId, 3);

      let playerInfo = await ludoGame.getPlayerInfo(gameId, 0);
      let movesNeeded = 51 - Number(playerInfo.position);

      while (movesNeeded > 0) {
        const currentPlayer = await ludoGame.getCurrentPlayer(gameId);
        if (currentPlayer === player1.address) {
          const moveSize = Math.min(6, movesNeeded);
          await ludoGame.connect(player1).makeMove(gameId, moveSize);
          movesNeeded -= moveSize;
        } else {
          await ludoGame.connect(player2).makeMove(gameId, 1);
        }

        const gameInfo = await ludoGame.getGameInfo(gameId);
        if (gameInfo.state === 2n) break;
      }

      const gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.state).to.equal(2);
      expect(gameInfo.winner).to.equal(player1.address);

      const player1FinalBalance = await ludoToken.balanceOf(player1.address);
      expect(player1FinalBalance).to.be.gt(player1InitialBalance);
    });
  });

  describe("View Functions", function () {
    let gameId: number;

    beforeEach(async function () {
      const tx = await ludoGame.createGame(STAKE_AMOUNT);
      await tx.wait();
      gameId = 1;
    });

    it("Should check color availability", async function () {
      expect(await ludoGame.isColorAvailable(gameId, 0)).to.be.true;

      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      expect(await ludoGame.isColorAvailable(gameId, 0)).to.be.false;
    });

    it("Should get current player correctly", async function () {
      await ludoGame.connect(player1).registerPlayer(gameId, "Player1", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Player2", 1);

      await ludoToken
        .connect(player1)
        .approve(await ludoGame.getAddress(), STAKE_AMOUNT);
      await ludoToken
        .connect(player2)
        .approve(await ludoGame.getAddress(), STAKE_AMOUNT);

      await ludoGame.connect(player1).stakeTokens(gameId);
      await ludoGame.connect(player2).stakeTokens(gameId);

      const currentPlayer = await ludoGame.getCurrentPlayer(gameId);
      expect(currentPlayer).to.equal(player1.address);
    });
  });
});

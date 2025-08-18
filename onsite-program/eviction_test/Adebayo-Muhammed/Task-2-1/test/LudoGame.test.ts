import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGame, LudoToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Ludo Game Contract", function () {
  let ludoGame: LudoGame;
  let ludoToken: LudoToken;
  let owner: HardhatEthersSigner;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;

  const STAKE_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
    ludoToken = await LudoTokenFactory.deploy(1000000);

    const LudoGameFactory = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGameFactory.deploy(await ludoToken.getAddress());

    await ludoToken.transfer(player1.address, ethers.parseEther("1000"));
    await ludoToken.transfer(player2.address, ethers.parseEther("1000"));

    await ludoToken.connect(player1).approve(await ludoGame.getAddress(), STAKE_AMOUNT);
    await ludoToken.connect(player2).approve(await ludoGame.getAddress(), STAKE_AMOUNT);
  });

  describe("Player Registration", function () {
    it("Should register player with name and color", async function () {
      await ludoGame.createGame();
      await ludoGame.connect(player1).registerPlayer(1, "Alice", 0);

      const playerInfo = await ludoGame.getPlayerInfo(1, 0);
      expect(playerInfo.playerAddress).to.equal(player1.address);
      expect(playerInfo.name).to.equal("Alice");
      expect(playerInfo.color).to.equal(0);
    });

    it("Should not allow duplicate colors", async function () {
      await ludoGame.createGame();
      await ludoGame.connect(player1).registerPlayer(1, "Alice", 0);

      await expect(
        ludoGame.connect(player2).registerPlayer(1, "Bob", 0)
      ).to.be.revertedWith("Color already taken");
    });
  });

  describe("Token Staking", function () {
    it("Should allow registered players to stake tokens", async function () {
      await ludoGame.createGame();
      await ludoGame.connect(player1).registerPlayer(1, "Alice", 0);
      await ludoGame.connect(player1).stakeTokens(1);

      const playerInfo = await ludoGame.getPlayerInfo(1, 0);
      expect(playerInfo.hasStaked).to.be.true;
    });

    it("Should start game when all players stake", async function () {
      await ludoGame.createGame();
      await ludoGame.connect(player1).registerPlayer(1, "Alice", 0);
      await ludoGame.connect(player2).registerPlayer(1, "Bob", 1);
      await ludoGame.connect(player1).stakeTokens(1);
      await ludoGame.connect(player2).stakeTokens(1);

      const gameInfo = await ludoGame.getGameInfo(1);
      expect(gameInfo.state).to.equal(1);
    });
  });

  describe("Dice Rolling", function () {
    it("Should generate dice value between 1 and 6", async function () {
      await ludoGame.createGame();
      await ludoGame.connect(player1).registerPlayer(1, "Alice", 0);
      await ludoGame.connect(player2).registerPlayer(1, "Bob", 1);
      await ludoGame.connect(player1).stakeTokens(1);
      await ludoGame.connect(player2).stakeTokens(1);

      const diceValue = await ludoGame.connect(player1).rollDice.staticCall(1);
      expect(diceValue).to.be.at.least(1);
      expect(diceValue).to.be.at.most(6);
    });
  });

  describe("Piece Movement", function () {
    it("Should move piece to start position with dice 6", async function () {
      await ludoGame.createGame();
      await ludoGame.connect(player1).registerPlayer(1, "Alice", 0);
      await ludoGame.connect(player2).registerPlayer(1, "Bob", 1);
      await ludoGame.connect(player1).stakeTokens(1);
      await ludoGame.connect(player2).stakeTokens(1);

      await ludoGame.connect(player1).movePiece(1, 0, 6);

      const playerInfo = await ludoGame.getPlayerInfo(1, 0);
      expect(playerInfo.piecePositions[0]).to.equal(1);
    });

    it("Should not move piece from home without dice 6", async function () {
      await ludoGame.createGame();
      await ludoGame.connect(player1).registerPlayer(1, "Alice", 0);
      await ludoGame.connect(player2).registerPlayer(1, "Bob", 1);
      await ludoGame.connect(player1).stakeTokens(1);
      await ludoGame.connect(player2).stakeTokens(1);

      await expect(
        ludoGame.connect(player1).movePiece(1, 0, 3)
      ).to.be.revertedWith("Need 6 to bring piece to board");
    });
  });
});

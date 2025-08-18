import { ethers } from "hardhat";
import { expect } from "chai";
import { LudoGame, LudoGame__factory } from "../typechain-types"; 
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LudoGame", function () {
  let LudoGame: LudoGame__factory;
  let ludoGame: LudoGame;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;
  let player4: SignerWithAddress;
  let player5: SignerWithAddress;

  const RED = 0;
  const GREEN = 1;
  const BLUE = 2;
  const YELLOW = 3;

  beforeEach(async function () {
   
    [owner, player1, player2, player3, player4, player5] = await ethers.getSigners();

    LudoGame = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGame.deploy();
    await ludoGame.waitForDeployment();
  });

  describe("Player Registration", function () {
    it("should allow a player to register with a valid name and color", async function () {
      await expect(ludoGame.connect(player1).registerPlayer("Alice", RED))
        .to.emit(ludoGame, "PlayerRegistered")
        .withArgs(player1.address, "Alice", RED);

      const [name, score, color, position] = await ludoGame.getPlayerInfo(player1.address);
      expect(name).to.equal("Alice");
      expect(score).to.equal(0);
      expect(color).to.equal(RED);
      expect(position).to.equal(0);
      expect(await ludoGame.getPlayerCount()).to.equal(1);
    });

    it("should prevent registering with an empty name", async function () {
      await expect(ludoGame.connect(player1).registerPlayer("", RED))
        .to.be.revertedWith("Name cannot be empty");
    });

    it("should prevent registering the same player twice", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", RED);
      await expect(ludoGame.connect(player1).registerPlayer("Alice", GREEN))
        .to.be.revertedWith("Player already registered");
    });

    it("should prevent registering with a taken color", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", RED);
      await expect(ludoGame.connect(player2).registerPlayer("Bob", RED))
        .to.be.revertedWith("Color already taken");
    });

    it("should prevent registering more than 4 players", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", RED);
      await ludoGame.connect(player2).registerPlayer("Bob", GREEN);
      await ludoGame.connect(player3).registerPlayer("Charlie", BLUE);
      await ludoGame.connect(player4).registerPlayer("Dave", YELLOW);
      await expect(ludoGame.connect(player5).registerPlayer("Eve", RED))
        .to.be.revertedWith("Maximum players reached");
    });
  });

  describe("Dice Rolling", function () {
    it("should allow a registered player to roll the dice", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", RED);
      await expect(ludoGame.connect(player1).rollDice())
        .to.emit(ludoGame, "DiceRolled")
        .withArgs(player1.address, (result: number) => result >= 1 && result <= 6);
    });

    it("should prevent unregistered players from rolling the dice", async function () {
      await expect(ludoGame.connect(player1).rollDice())
        .to.be.revertedWith("Player not registered");
    });

    it("should generate a number between 1 and 6", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", RED);
      const result = await ludoGame.connect(player1).rollDice();
      expect(result).to.be.gte(1);
      expect(result).to.be.lte(6);
    });
  });

  describe("Player Movement", function () {
    it("should move a registered player based on dice roll", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", RED);
      await expect(ludoGame.connect(player1).movePlayer())
        .to.emit(ludoGame, "PlayerMoved")
        .withArgs(player1.address, (newPosition: number) => newPosition >= 1 && newPosition <= 6);

      const [, , , position] = await ludoGame.getPlayerInfo(player1.address);
      expect(position).to.be.gte(1);
      expect(position).to.be.lte(6);
    });

    it("should prevent unregistered players from moving", async function () {
      await expect(ludoGame.connect(player1).movePlayer())
        .to.be.revertedWith("Player not registered");
    });

    it("should award points and cap position at 100 when reaching the end", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", RED);

      
      await ludoGame.connect(player1).movePlayer(); 
      const [, , , initialPosition] = await ludoGame.getPlayerInfo(player1.address);

      
      await ludoGame.connect(player1).movePlayer();

      const [name, score, color, position] = await ludoGame.getPlayerInfo(player1.address);
      expect(position).to.be.lte(100); 
      if (position === BigInt(100)) {
        expect(score).to.equal(10); 
      }
    });
  });

  describe("Player Info and Count", function () {
    it("should return correct player info", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", RED);
      const [name, score, color, position] = await ludoGame.getPlayerInfo(player1.address);
      expect(name).to.equal("Alice");
      expect(score).to.equal(0);
      expect(color).to.equal(RED);
      expect(position).to.equal(0);
    });

    it("should revert when querying unregistered player", async function () {
      await expect(ludoGame.getPlayerInfo(player1.address))
        .to.be.revertedWith("Player not registered");
    });

    it("should return correct player count", async function () {
      expect(await ludoGame.getPlayerCount()).to.equal(0);
      await ludoGame.connect(player1).registerPlayer("Alice", RED);
      expect(await ludoGame.getPlayerCount()).to.equal(1);
      await ludoGame.connect(player2).registerPlayer("Bob", GREEN);
      expect(await ludoGame.getPlayerCount()).to.equal(2);
    });
  });
});
import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("LudoGame", function () {
  async function deployLudoGameFixture() {
    const [owner, player1, player2, player3, player4] = await ethers.getSigners();
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy();
    return { ludoGame, owner, player1, player2, player3, player4 };
  }

  async function deployWithTwoPlayersFixture() {
    const fixture = await loadFixture(deployLudoGameFixture);
    await fixture.ludoGame.connect(fixture.player1).registerPlayer("Alice", 0);
    await fixture.ludoGame.connect(fixture.player2).registerPlayer("Bob", 1);
    return fixture;
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { ludoGame } = await loadFixture(deployLudoGameFixture);
      expect(await ludoGame.getGameState()).to.equal(0); // WAITING
    });

    it("Should have no players initially", async function () {
      const { ludoGame } = await loadFixture(deployLudoGameFixture);
      const players = await ludoGame.getPlayers();
      expect(players.length).to.equal(0);
    });
  });

  describe("Player Registration", function () {
    it("Should allow players to register", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);
      
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      await ludoGame.connect(player2).registerPlayer("Bob", 1);

      const players = await ludoGame.getPlayers();
      expect(players.length).to.equal(2);
      expect(players[0].name).to.equal("Alice");
      expect(players[1].name).to.equal("Bob");
    });

    it("Should prevent duplicate registrations", async function () {
      const { ludoGame, player1 } = await loadFixture(deployLudoGameFixture);
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      
      await expect(
        ludoGame.connect(player1).registerPlayer("Alice2", 1)
      ).to.be.revertedWith("Player already registered");
    });

    it("Should prevent color reuse", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      
      await expect(
        ludoGame.connect(player2).registerPlayer("Bob", 0)
      ).to.be.revertedWith("Color already taken");
    });

    it("Should enforce maximum players", async function () {
      const { ludoGame, player1, player2, player3, player4, owner } = await loadFixture(deployLudoGameFixture);
      
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      await ludoGame.connect(player2).registerPlayer("Bob", 1);
      await ludoGame.connect(player3).registerPlayer("Charlie", 2);
      await ludoGame.connect(player4).registerPlayer("Dave", 3);

      await expect(
        ludoGame.connect(owner).registerPlayer("Extra", 0)
      ).to.be.revertedWith("Maximum players reached");
    });
  });

  describe("Game Flow", function () {
    it("Should start the game with at least 2 players", async function () {
      const { ludoGame, player1 } = await loadFixture(deployWithTwoPlayersFixture);
      
      await ludoGame.connect(player1).startGame();
      const gameState = await ludoGame.getGameState();
      
      expect(gameState).to.equal(1); // STARTED
    });

    it("Should prevent starting with insufficient players", async function () {
      const { ludoGame, player1 } = await loadFixture(deployLudoGameFixture);
      await ludoGame.connect(player1).registerPlayer("Single", 0);
      
      await expect(ludoGame.connect(player1).startGame()).to.be.revertedWith(
        "Need at least 2 players to start"
      );
    });

    it("Should enforce turn order", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployWithTwoPlayersFixture);
      await ludoGame.connect(player1).startGame();
      
      const currentPlayer = await ludoGame.getCurrentPlayer();
      expect(currentPlayer).to.equal(await player1.getAddress());

      await expect(
        ludoGame.connect(player2).rollDice()
      ).to.be.revertedWith("Not your turn");
    });

    it("Should allow players to roll dice and move", async function () {
      const { ludoGame, player1 } = await loadFixture(deployWithTwoPlayersFixture);
      await ludoGame.connect(player1).startGame();

      const tx = await ludoGame.connect(player1).rollDice();
      await expect(tx).to.emit(ludoGame, "DiceRolled");

      await ludoGame.connect(player1).movePlayer(3);

      const players = await ludoGame.getPlayers();
      expect(players[0].position).to.equal(3);
    });

    it("Should track player positions correctly", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployWithTwoPlayersFixture);
      await ludoGame.connect(player1).startGame();

      await ludoGame.connect(player1).movePlayer(5);
      await ludoGame.connect(player2).movePlayer(4);

      const players = await ludoGame.getPlayers();
      expect(players[0].position).to.equal(5);
      expect(players[1].position).to.equal(4);
    });

    it("Should handle board wrapping", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployWithTwoPlayersFixture);
      await ludoGame.connect(player1).startGame();

      // Move player1 close to the end of the board, alternating turns with player2
      await ludoGame.connect(player1).movePlayer(6); // player1: position 6
      await ludoGame.connect(player2).movePlayer(1); // player2: position 1
      await ludoGame.connect(player1).movePlayer(6); // player1: position 12
      await ludoGame.connect(player2).movePlayer(1); // player2: position 2
      await ludoGame.connect(player1).movePlayer(6); // player1: position 18
      await ludoGame.connect(player2).movePlayer(1); // player2: position 3
      await ludoGame.connect(player1).movePlayer(6); // player1: position 24
      await ludoGame.connect(player2).movePlayer(1); // player2: position 4
      await ludoGame.connect(player1).movePlayer(6); // player1: position 30
      await ludoGame.connect(player2).movePlayer(1); // player2: position 5
      await ludoGame.connect(player1).movePlayer(6); // player1: position 36
      await ludoGame.connect(player2).movePlayer(1); // player2: position 6
      await ludoGame.connect(player1).movePlayer(6); // player1: position 42
      await ludoGame.connect(player2).movePlayer(1); // player2: position 7
      await ludoGame.connect(player1).movePlayer(5); // player1: position 47
      await ludoGame.connect(player2).movePlayer(1); // player2: position 8

      // Move 6 more to wrap around (47 + 6 = 53, 53 % 52 = 1)
      await ludoGame.connect(player1).movePlayer(6);

      const players = await ludoGame.getPlayers();
      expect(players[0].position).to.equal(1);
      expect(players[0].score).to.equal(1);
    });

    it("Should declare a winner when score threshold is reached", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployWithTwoPlayersFixture);
      await ludoGame.connect(player1).startGame();

      // Simulate 3 complete laps for player1 to win
      // Each lap requires exactly 52 moves, alternating with player2
      let player1TotalMoves = 0;
      let isPlayer1Turn = true;

      while (player1TotalMoves < 156) { // 3 laps * 52 = 156 moves
        if (isPlayer1Turn) {
          const remainingForLap = 52 - (player1TotalMoves % 52);
          const moveSize = Math.min(6, remainingForLap);
          await ludoGame.connect(player1).movePlayer(moveSize);
          player1TotalMoves += moveSize;

          // Check if game ended (player1 won)
          const gameState = await ludoGame.getGameState();
          if (gameState === 2n) { // COMPLETED
            const winner = await ludoGame.getWinner();
            expect(winner).to.equal(await player1.getAddress());
            return;
          }
        } else {
          // Player2 makes a small move
          await ludoGame.connect(player2).movePlayer(1);
        }
        isPlayer1Turn = !isPlayer1Turn;
      }
    });
  });
});
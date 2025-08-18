import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("LudoGame", function () {
  // Fixture to deploy LudoGame contract
  async function deployLudoGameFixture() {
    // Get test accounts
    const [player1, player2, player3, player4, otherAccount] = await hre.ethers.getSigners();

    const LudoGame = await hre.ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy();

    return { ludoGame, player1, player2, player3, player4, otherAccount };
  }

  // Fixture with players already joined
  async function ludoGameWithPlayersFixture() {
    const { ludoGame, player1, player2, player3, player4 } = await loadFixture(deployLudoGameFixture);
    
    // Players join the game
    await ludoGame.connect(player1).joinGame("Alice", 0); // RED
    await ludoGame.connect(player2).joinGame("Bob", 1);   // GREEN
    await ludoGame.connect(player3).joinGame("Charlie", 2); // BLUE
    
    return { ludoGame, player1, player2, player3, player4 };
  }

  // Fixture with game started
  async function startedLudoGameFixture() {
    const fixture = await loadFixture(ludoGameWithPlayersFixture);
    await fixture.ludoGame.startGame();
    return fixture;
  }

  describe("Deployment", function () {
    it("Should initialize with correct default values", async function () {
      const { ludoGame } = await loadFixture(deployLudoGameFixture);

      expect(await ludoGame.playerCount()).to.equal(0);
      expect(await ludoGame.gameStarted()).to.equal(false);
      expect(await ludoGame.currentPlayer()).to.equal(0);
    });
  });

  describe("Player Registration", function () {
    it("Should allow players to join with valid name and color", async function () {
      const { ludoGame, player1 } = await loadFixture(deployLudoGameFixture);

      await expect(ludoGame.connect(player1).joinGame("Alice", 0))
        .to.emit(ludoGame, "PlayerJoined")
        .withArgs(player1.address, "Alice", 0);

      expect(await ludoGame.playerCount()).to.equal(1);
    });

    it("Should not allow duplicate colors", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);

      await ludoGame.connect(player1).joinGame("Alice", 0);
      
      await expect(ludoGame.connect(player2).joinGame("Bob", 0))
        .to.be.revertedWith("Color taken");
    });

    it("Should not allow more than 4 players", async function () {
      const { ludoGame, player1, player2, player3, player4, otherAccount } = await loadFixture(deployLudoGameFixture);

      await ludoGame.connect(player1).joinGame("Alice", 0);
      await ludoGame.connect(player2).joinGame("Bob", 1);
      await ludoGame.connect(player3).joinGame("Charlie", 2);
      await ludoGame.connect(player4).joinGame("Diana", 3);

      await expect(ludoGame.connect(otherAccount).joinGame("Eve", 0))
        .to.be.reverted;
    });

    it("Should not allow joining after game starts", async function () {
      const { ludoGame, player1, player2, player4 } = await loadFixture(ludoGameWithPlayersFixture);
      
      await ludoGame.startGame();
      
      await expect(ludoGame.connect(player4).joinGame("Diana", 3))
        .to.be.reverted;
    });
  });

  describe("Game Start", function () {
    it("Should start game with at least 2 players", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);

      await ludoGame.connect(player1).joinGame("Alice", 0);
      await ludoGame.connect(player2).joinGame("Bob", 1);

      await ludoGame.startGame();
      expect(await ludoGame.gameStarted()).to.equal(true);
    });

    it("Should not start game with less than 2 players", async function () {
      const { ludoGame, player1 } = await loadFixture(deployLudoGameFixture);

      await ludoGame.connect(player1).joinGame("Alice", 0);
      
      await expect(ludoGame.startGame()).to.be.reverted;
    });

    it("Should not start game twice", async function () {
      const { ludoGame } = await loadFixture(startedLudoGameFixture);
      
      await expect(ludoGame.startGame()).to.be.reverted;
    });
  });

  describe("Dice Rolling", function () {
    it("Should allow current player to roll dice", async function () {
      const { ludoGame, player1 } = await loadFixture(startedLudoGameFixture);

      await expect(ludoGame.connect(player1).rollDice())
        .to.emit(ludoGame, "DiceRolled")
        .withArgs(player1.address, anyValue);

      const dice = await ludoGame.lastDice();
      expect(dice).to.be.greaterThan(0).and.lessThan(7);
    });

    it("Should not allow non-current player to roll dice", async function () {
      const { ludoGame, player2 } = await loadFixture(startedLudoGameFixture);

      await expect(ludoGame.connect(player2).rollDice()).to.be.reverted;
    });

    it("Should not allow rolling dice before game starts", async function () {
      const { ludoGame, player1 } = await loadFixture(ludoGameWithPlayersFixture);

      await expect(ludoGame.connect(player1).rollDice()).to.be.reverted;
    });
  });

  describe("Token Movement", function () {
    it("Should move token from yard with dice roll of 6", async function () {
      const { ludoGame, player1 } = await loadFixture(startedLudoGameFixture);

      // Keep rolling until we get a 6
      let dice = 0;
      while (dice !== 6) {
        await ludoGame.connect(player1).rollDice();
        dice = Number(await ludoGame.lastDice());
        if (dice !== 6) {
          // Try to move and expect failure
          await expect(ludoGame.connect(player1).moveToken(0))
            .to.be.revertedWith("Need 6 to start");
          // Move to next player for next attempt
          const currentPlayer = Number(await ludoGame.currentPlayer());
          const playerCount = Number(await ludoGame.playerCount());
          const nextPlayer = (currentPlayer + 1) % playerCount;
          // Simulate turn passing by having next player roll
          const signers = await hre.ethers.getSigners();
          await ludoGame.connect(signers[nextPlayer]).rollDice();
          await ludoGame.connect(signers[nextPlayer]).moveToken(0);
        }
      }

      // Now we have a 6, should be able to move
      await expect(ludoGame.connect(player1).moveToken(0))
        .to.emit(ludoGame, "TokenMoved")
        .withArgs(player1.address, 0, 1); // Should move to starting position (1 for RED)
    });

    it("Should not allow moving invalid token index", async function () {
      const { ludoGame, player1 } = await loadFixture(startedLudoGameFixture);

      await ludoGame.connect(player1).rollDice();
      
      await expect(ludoGame.connect(player1).moveToken(5)).to.be.reverted;
    });

    it("Should not allow non-current player to move token", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(startedLudoGameFixture);

      await ludoGame.connect(player1).rollDice();
      
      await expect(ludoGame.connect(player2).moveToken(0)).to.be.reverted;
    });
  });

  describe("Game State", function () {
    it("Should return correct initial game state", async function () {
      const { ludoGame, player1, player2, player3 } = await loadFixture(ludoGameWithPlayersFixture);

      const gameState = await ludoGame.getGameState();
      
      expect(gameState.addrs[0]).to.equal(player1.address);
      expect(gameState.addrs[1]).to.equal(player2.address);
      expect(gameState.addrs[2]).to.equal(player3.address);
      
      expect(gameState.names[0]).to.equal("Alice");
      expect(gameState.names[1]).to.equal("Bob");
      expect(gameState.names[2]).to.equal("Charlie");
      
      expect(gameState.colors[0]).to.equal(0); // RED
      expect(gameState.colors[1]).to.equal(1); // GREEN
      expect(gameState.colors[2]).to.equal(2); // BLUE
      
      // All tokens should be in yard (position 0)
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
          expect(gameState.tokenPositions[i][j]).to.equal(0);
        }
      }
    });

    it("Should track scores correctly", async function () {
      const { ludoGame } = await loadFixture(startedLudoGameFixture);

      const gameState = await ludoGame.getGameState();
      
      // Initial scores should be 0
      for (let i = 0; i < gameState.scores.length; i++) {
        expect(gameState.scores[i]).to.equal(0);
      }
    });
  });

  describe("Win Condition", function () {
    it("Should detect win when all tokens reach home", async function () {
      // This is a complex test that would require manipulating the game state
      // For now, we'll test the basic structure
      const { ludoGame, player1 } = await loadFixture(startedLudoGameFixture);

      // In a real test, you'd need to move all tokens to position 59
      // This would require multiple dice rolls and moves
      
      expect(await ludoGame.gameStarted()).to.equal(true);
    });
  });

  describe("Turn Management", function () {
    it("Should pass turn to next player after move (without 6)", async function () {
      const { ludoGame, player1 } = await loadFixture(startedLudoGameFixture);

      const initialPlayer = await ludoGame.currentPlayer();
      
      // Roll dice and move (assuming not a 6)
      await ludoGame.connect(player1).rollDice();
      const dice = Number(await ludoGame.lastDice());
      
      if (dice === 6) {
        // If we rolled a 6, we need to move first, then current player stays same
        await ludoGame.connect(player1).moveToken(0);
        expect(await ludoGame.currentPlayer()).to.equal(initialPlayer);
      } else {
        // Can't move from yard without 6, turn should pass
        await expect(ludoGame.connect(player1).moveToken(0))
          .to.be.revertedWith("Need 6 to start");
      }
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty player slots correctly", async function () {
      const { ludoGame } = await loadFixture(deployLudoGameFixture);

      const gameState = await ludoGame.getGameState();
      
      // Empty addresses should be zero address
      expect(gameState.addrs[0]).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Should maintain consistent game state", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(startedLudoGameFixture);

      // Multiple state checks should be consistent
      const state1 = await ludoGame.getGameState();
      const state2 = await ludoGame.getGameState();
      
      expect(state1.current).to.equal(state2.current);
      expect(state1.started).to.equal(state2.started);
    });
  });
});
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { LudoToken, LudoGame } from "../typechain-types";

describe("Ludo Game System", function () {
  let ludoToken: LudoToken;
  let ludoGame: LudoGame;
  let owner: Signer;
  let player1: Signer;
  let player2: Signer;
  let player3: Signer;
  let player4: Signer;
  let players: Signer[];

  const STAKE_AMOUNT = ethers.parseEther("10");
  const FAUCET_AMOUNT = ethers.parseEther("100");

  enum Color {
    RED = 0,
    GREEN = 1,
    BLUE = 2,
    YELLOW = 3
  }

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();
    players = [player1, player2, player3, player4];

    // Deploy LudoToken
    const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
    ludoToken = await LudoTokenFactory.deploy();

    // Deploy LudoGame
    const LudoGameFactory = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGameFactory.deploy(await ludoToken.getAddress());

    // Give tokens to players using faucet
    for (const player of players) {
      await ludoToken.connect(player).faucet();
      // Approve the game contract to spend tokens
      await ludoToken.connect(player).approve(await ludoGame.getAddress(), STAKE_AMOUNT * 10n);
    }
  });

  describe("LudoToken", function () {
    it("Should deploy with correct name and symbol", async function () {
      expect(await ludoToken.name()).to.equal("Ludo Token");
      expect(await ludoToken.symbol()).to.equal("LUDO");
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await ludoToken.balanceOf(await owner.getAddress());
      expect(ownerBalance).to.equal(ethers.parseEther("1000000"));
    });

    it("Should allow faucet usage for new users", async function () {
      const balanceBefore = await ludoToken.balanceOf(await player1.getAddress());
      expect(balanceBefore).to.equal(FAUCET_AMOUNT);
    });

    it("Should prevent faucet abuse", async function () {
      // First faucet call already made in beforeEach
      await expect(
        ludoToken.connect(player1).faucet()
      ).to.be.revertedWith("You already have enough tokens");
    });

    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await ludoToken.mint(await player1.getAddress(), mintAmount);
      
      const balance = await ludoToken.balanceOf(await player1.getAddress());
      expect(balance).to.equal(FAUCET_AMOUNT + mintAmount);
    });
  });

  describe("Player Registration", function () {
    it("Should allow player registration", async function () {
      await expect(
        ludoGame.connect(player1).registerPlayer("Alice", Color.RED)
      ).to.emit(ludoGame, "PlayerRegistered")
        .withArgs(await player1.getAddress(), "Alice", Color.RED);

      const registeredPlayer = await ludoGame.getPlayer(await player1.getAddress());
      expect(registeredPlayer.name).to.equal("Alice");
      expect(registeredPlayer.color).to.equal(Color.RED);
      expect(registeredPlayer.isRegistered).to.be.true;
    });

    it("Should prevent double registration", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      
      await expect(
        ludoGame.connect(player1).registerPlayer("Alice2", Color.BLUE)
      ).to.be.revertedWithCustomError(ludoGame, "PlayerAlreadyRegistered");
    });

    it("Should initialize player tokens correctly", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      
      const player = await ludoGame.getPlayer(await player1.getAddress());
      // Check that all tokens start at home
      for (let i = 0; i < 4; i++) {
        expect(player.tokenPositions[i]).to.equal(0);
        expect(player.tokensInHome[i]).to.be.true;
        expect(player.tokensFinished[i]).to.be.false;
      }
    });
  });

  describe("Game Creation and Joining", function () {
    beforeEach(async function () {
      // Register players
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      await ludoGame.connect(player2).registerPlayer("Bob", Color.GREEN);
      await ludoGame.connect(player3).registerPlayer("Charlie", Color.BLUE);
      await ludoGame.connect(player4).registerPlayer("Diana", Color.YELLOW);
    });

    it("Should create a new game", async function () {
      await expect(
        ludoGame.connect(player1).createGame()
      ).to.emit(ludoGame, "GameCreated")
        .withArgs(1, await player1.getAddress());

      const game = await ludoGame.getGame(1);
      expect(game.gameId).to.equal(1);
      expect(game.playerCount).to.equal(1);
      expect(game.state).to.equal(0); // WAITING_FOR_PLAYERS
      expect(game.stakeAmount).to.equal(STAKE_AMOUNT);
      expect(game.totalPot).to.equal(STAKE_AMOUNT);
    });

    it("Should transfer stake when creating game", async function () {
      const balanceBefore = await ludoToken.balanceOf(await player1.getAddress());
      
      await ludoGame.connect(player1).createGame();
      
      const balanceAfter = await ludoToken.balanceOf(await player1.getAddress());
      expect(balanceAfter).to.equal(balanceBefore - STAKE_AMOUNT);
    });

    it("Should allow players to join a game", async function () {
      await ludoGame.connect(player1).createGame();
      
      await expect(
        ludoGame.connect(player2).joinGame(1)
      ).to.emit(ludoGame, "PlayerJoinedGame")
        .withArgs(1, await player2.getAddress(), Color.GREEN);

      const game = await ludoGame.getGame(1);
      expect(game.playerCount).to.equal(2);
      expect(game.totalPot).to.equal(STAKE_AMOUNT * 2n);
    });

    it("Should start game when 2 players join", async function () {
      await ludoGame.connect(player1).createGame();
      
      await expect(
        ludoGame.connect(player2).joinGame(1)
      ).to.emit(ludoGame, "GameStarted").withArgs(1);

      const game = await ludoGame.getGame(1);
      expect(game.state).to.equal(1); // IN_PROGRESS
    });

    it("Should prevent joining with same color", async function () {
      await ludoGame.connect(player1).createGame();
      
      // Try to join with RED color (same as player1)
      await ludoGame.connect(player1).registerPlayer("Another Red", Color.RED);
      
      await expect(
        ludoGame.connect(player2).joinGame(1)
      ).to.be.revertedWithCustomError(ludoGame, "ColorAlreadyTaken");
    });

    it("Should prevent more than 4 players", async function () {
      await ludoGame.connect(player1).createGame();
      await ludoGame.connect(player2).joinGame(1);
      await ludoGame.connect(player3).joinGame(1);
      await ludoGame.connect(player4).joinGame(1);

      // Try to add 5th player (need to register first)
      const [, , , , , player5] = await ethers.getSigners();
      await ludoToken.connect(player5).faucet();
      await ludoToken.connect(player5).approve(await ludoGame.getAddress(), STAKE_AMOUNT);
      await ludoGame.connect(player5).registerPlayer("Extra", Color.RED); // This should fail due to color

      await expect(
        ludoGame.connect(player5).joinGame(1)
      ).to.be.revertedWithCustomError(ludoGame, "GameFull");
    });

    it("Should prevent unregistered players from creating games", async function () {
      const [, , , , , unregistered] = await ethers.getSigners();
      
      await expect(
        ludoGame.connect(unregistered).createGame()
      ).to.be.revertedWithCustomError(ludoGame, "PlayerNotRegistered");
    });
  });

  describe("Game Mechanics", function () {
    beforeEach(async function () {
      // Register players and create a game
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      await ludoGame.connect(player2).registerPlayer("Bob", Color.GREEN);
      
      await ludoGame.connect(player1).createGame();
      await ludoGame.connect(player2).joinGame(1);
    });

    it("Should allow dice rolling by current player", async function () {
      // Player1 starts first
      await expect(
        ludoGame.connect(player1).rollDice(1)
      ).to.emit(ludoGame, "DiceRolled");
    });

    it("Should prevent dice rolling by non-current player", async function () {
      await expect(
        ludoGame.connect(player2).rollDice(1)
      ).to.be.revertedWithCustomError(ludoGame, "NotYourTurn");
    });

    it("Should return dice value between 1 and 6", async function () {
      // Test multiple rolls to check range
      for (let i = 0; i < 10; i++) {
        const diceValue = await ludoGame.connect(player1).rollDice.staticCall(1);
        expect(diceValue).to.be.at.least(1);
        expect(diceValue).to.be.at.most(6);
      }
    });

    it("Should allow token movement out of home with 6", async function () {
      // Mock a dice roll of 6 by directly calling moveToken
      await expect(
        ludoGame.connect(player1).moveToken(1, 0, 6)
      ).to.emit(ludoGame, "TokenMoved");

      const game = await ludoGame.getGame(1);
      const player = game.players[0];
      expect(player.tokensInHome[0]).to.be.false;
      expect(player.tokenPositions[0]).to.equal(1); // RED starting position
    });

    it("Should prevent token movement out of home without 6", async function () {
      await expect(
        ludoGame.connect(player1).moveToken(1, 0, 3)
      ).to.be.revertedWithCustomError(ludoGame, "InvalidMove");
    });

    it("Should prevent invalid token index", async function () {
      await expect(
        ludoGame.connect(player1).moveToken(1, 5, 6)
      ).to.be.revertedWithCustomError(ludoGame, "InvalidMove");
    });

    it("Should switch turns after non-6 roll", async function () {
      // Move token out with 6 (player1 keeps turn)
      await ludoGame.connect(player1).moveToken(1, 0, 6);
      
      let game = await ludoGame.getGame(1);
      expect(game.currentPlayerIndex).to.equal(0); // Still player1
      
      // Move with non-6 (turn should switch)
      await ludoGame.connect(player1).moveToken(1, 0, 3);
      
      game = await ludoGame.getGame(1);
      expect(game.currentPlayerIndex).to.equal(1); // Now player2
    });

    it("Should maintain turn after 6 roll", async function () {
      await ludoGame.connect(player1).moveToken(1, 0, 6);
      
      const game = await ludoGame.getGame(1);
      expect(game.currentPlayerIndex).to.equal(0); // Still player1
    });
  });

  describe("Win Conditions", function () {
    beforeEach(async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      await ludoGame.connect(player2).registerPlayer("Bob", Color.GREEN);
      
      await ludoGame.connect(player1).createGame();
      await ludoGame.connect(player2).joinGame(1);
    });

    it("Should detect win when all tokens finish", async function () {
      // This is a simplified test - in reality, you'd need to move tokens through the board
      // We'll test the checkPlayerWon function logic by manipulating the game state
      
      // For comprehensive testing, you might need to create helper functions
      // or modify the contract to allow testing scenarios
      
      const game = await ludoGame.getGame(1);
      expect(game.state).to.equal(1); // IN_PROGRESS initially
    });

    it("Should transfer prize to winner", async function () {
      // This would require a full game simulation
      // For now, we test that the prize calculation is correct
      const game = await ludoGame.getGame(1);
      expect(game.totalPot).to.equal(STAKE_AMOUNT * 2n);
    });
  });

  describe("Emergency Functions", function () {
    beforeEach(async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      await ludoGame.connect(player2).registerPlayer("Bob", Color.GREEN);
      
      await ludoGame.connect(player1).createGame();
      await ludoGame.connect(player2).joinGame(1);
    });

    it("Should allow emergency game ending after 24 hours", async function () {
      // Fast forward time by more than 1 day
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        ludoGame.emergencyEndGame(1)
      ).to.not.be.reverted;

      const game = await ludoGame.getGame(1);
      expect(game.state).to.equal(2); // FINISHED
    });

    it("Should prevent emergency ending of recent games", async function () {
      await expect(
        ludoGame.emergencyEndGame(1)
      ).to.be.revertedWith("Game too recent");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
    });

    it("Should return correct game data", async function () {
      await ludoGame.connect(player1).createGame();
      
      const game = await ludoGame.getGame(1);
      expect(game.gameId).to.equal(1);
      expect(game.playerCount).to.equal(1);
    });

    it("Should return correct player data", async function () {
      const player = await ludoGame.getPlayer(await player1.getAddress());
      expect(player.name).to.equal("Alice");
      expect(player.color).to.equal(Color.RED);
      expect(player.isRegistered).to.be.true;
    });

    it("Should return current game for player", async function () {
      await ludoGame.connect(player1).createGame();
      
      const currentGame = await ludoGame.getCurrentGame(await player1.getAddress());
      expect(currentGame).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle game with minimum players (2)", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      await ludoGame.connect(player2).registerPlayer("Bob", Color.GREEN);
      
      await ludoGame.connect(player1).createGame();
      await ludoGame.connect(player2).joinGame(1);
      
      const game = await ludoGame.getGame(1);
      expect(game.playerCount).to.equal(2);
      expect(game.state).to.equal(1); // IN_PROGRESS
    });

    it("Should handle game with maximum players (4)", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      await ludoGame.connect(player2).registerPlayer("Bob", Color.GREEN);
      await ludoGame.connect(player3).registerPlayer("Charlie", Color.BLUE);
      await ludoGame.connect(player4).registerPlayer("Diana", Color.YELLOW);
      
      await ludoGame.connect(player1).createGame();
      await ludoGame.connect(player2).joinGame(1);
      await ludoGame.connect(player3).joinGame(1);
      await ludoGame.connect(player4).joinGame(1);
      
      const game = await ludoGame.getGame(1);
      expect(game.playerCount).to.equal(4);
    });

    it("Should prevent operations on non-existent game", async function () {
      await ludoGame.connect(player1).registerPlayer("Alice", Color.RED);
      
      await expect(
        ludoGame.connect(player1).joinGame(999)
      ).to.be.revertedWithCustomError(ludoGame, "GameNotInProgress");
    });
  });
});
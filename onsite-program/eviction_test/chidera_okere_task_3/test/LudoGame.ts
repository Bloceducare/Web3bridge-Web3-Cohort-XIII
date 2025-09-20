import { expect } from "chai";
import hre from "hardhat";

describe("Ludo Game", function () {
  let gameToken: any;
  let ludoGame: any;
  let owner: any;
  let player1: any;
  let player2: any;
  let player3: any;
  let player4: any;

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await hre.ethers.getSigners();

    // Deploy GameToken
    const GameTokenFactory = await hre.ethers.getContractFactory("GameToken");
    gameToken = await GameTokenFactory.deploy(1000000); // 1M tokens

    // Deploy LudoGame
    const LudoGameFactory = await hre.ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGameFactory.deploy(await gameToken.getAddress());

    // Mint tokens to players for testing
    await gameToken.mint(player1.address, hre.ethers.parseEther("100"));
    await gameToken.mint(player2.address, hre.ethers.parseEther("100"));
    await gameToken.mint(player3.address, hre.ethers.parseEther("100"));
    await gameToken.mint(player4.address, hre.ethers.parseEther("100"));
  });

  describe("Game Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await gameToken.name()).to.equal("Ludo Game Token");
      expect(await gameToken.symbol()).to.equal("LGT");
    });

    it("Should mint tokens correctly", async function () {
      expect(await gameToken.balanceOf(player1.address)).to.equal(hre.ethers.parseEther("100"));
    });
  });

  describe("Ludo Game", function () {
    it("Should create a new game", async function () {
      const tx = await ludoGame.createGame();
      await tx.wait();
      
      const gameCounter = await ludoGame.gameCounter();
      expect(gameCounter).to.equal(1);
    });

    it("Should register players correctly", async function () {
      await ludoGame.createGame();
      const gameId = 1;

      await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0); // RED
      await ludoGame.connect(player2).registerPlayer(gameId, "Bob", 1);   // BLUE

      const gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.playerCount).to.equal(2);

      const player1Info = await ludoGame.getPlayerInfo(gameId, 0);
      expect(player1Info.name).to.equal("Alice");
      expect(player1Info.color).to.equal(0); // RED
    });

    it("Should not allow duplicate colors", async function () {
      await ludoGame.createGame();
      const gameId = 1;

      await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0); // RED
      
      await expect(
        ludoGame.connect(player2).registerPlayer(gameId, "Bob", 0) // RED again
      ).to.be.revertedWith("Color already taken");
    });

    it("Should not allow more than 4 players", async function () {
      await ludoGame.createGame();
      const gameId = 1;

      await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0); // RED
      await ludoGame.connect(player2).registerPlayer(gameId, "Bob", 1);   // BLUE
      await ludoGame.connect(player3).registerPlayer(gameId, "Charlie", 2); // GREEN
      await ludoGame.connect(player4).registerPlayer(gameId, "David", 3);   // YELLOW

      // Try to add a 5th player
      const [, , , , , player5] = await hre.ethers.getSigners();
      await expect(
        ludoGame.connect(player5).registerPlayer(gameId, "Eve", 0)
      ).to.be.revertedWith("Game is full");
    });

    it("Should allow players to stake tokens and start game", async function () {
      await ludoGame.createGame();
      const gameId = 1;

      // Register players
      await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Bob", 1);

      // Approve tokens
      const stakeAmount = hre.ethers.parseEther("10");
      await gameToken.connect(player1).approve(await ludoGame.getAddress(), stakeAmount);
      await gameToken.connect(player2).approve(await ludoGame.getAddress(), stakeAmount);

      // Stake tokens
      await ludoGame.connect(player1).stakeTokens(gameId);
      await ludoGame.connect(player2).stakeTokens(gameId);

      const gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.gameStarted).to.be.true;
      expect(gameInfo.totalPrize).to.equal(hre.ethers.parseEther("20"));
    });

    it("Should allow dice rolling and player movement", async function () {
      await ludoGame.createGame();
      const gameId = 1;

      // Register and stake
      await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Bob", 1);

      const stakeAmount = hre.ethers.parseEther("10");
      await gameToken.connect(player1).approve(await ludoGame.getAddress(), stakeAmount);
      await gameToken.connect(player2).approve(await ludoGame.getAddress(), stakeAmount);

      await ludoGame.connect(player1).stakeTokens(gameId);
      await ludoGame.connect(player2).stakeTokens(gameId);

      // Player 1's turn (index 0)
      const tx = await ludoGame.connect(player1).rollDice(gameId);
      const receipt = await tx.wait();
      
      // Check that dice was rolled and player moved
      expect(receipt).to.not.be.null;
      
      const player1Info = await ludoGame.getPlayerInfo(gameId, 0);
      expect(player1Info.position).to.be.gt(0);
      expect(player1Info.position).to.be.lte(6); // Dice roll is 1-6
    });

    it("Should not allow rolling dice when it's not player's turn", async function () {
      await ludoGame.createGame();
      const gameId = 1;

      // Register and stake
      await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Bob", 1);

      const stakeAmount = hre.ethers.parseEther("10");
      await gameToken.connect(player1).approve(await ludoGame.getAddress(), stakeAmount);
      await gameToken.connect(player2).approve(await ludoGame.getAddress(), stakeAmount);

      await ludoGame.connect(player1).stakeTokens(gameId);
      await ludoGame.connect(player2).stakeTokens(gameId);

      // Try to roll dice with player 2 when it's player 1's turn
      await expect(
        ludoGame.connect(player2).rollDice(gameId)
      ).to.be.revertedWith("Not your turn");
    });

    it("Should track current player turn correctly", async function () {
      await ludoGame.createGame();
      const gameId = 1;

      // Register and stake
      await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0);
      await ludoGame.connect(player2).registerPlayer(gameId, "Bob", 1);

      const stakeAmount = hre.ethers.parseEther("10");
      await gameToken.connect(player1).approve(await ludoGame.getAddress(), stakeAmount);
      await gameToken.connect(player2).approve(await ludoGame.getAddress(), stakeAmount);

      await ludoGame.connect(player1).stakeTokens(gameId);
      await ludoGame.connect(player2).stakeTokens(gameId);

      // Check initial turn
      let gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.currentPlayerTurn).to.equal(0); // Player 1's turn

      // Player 1 rolls dice
      await ludoGame.connect(player1).rollDice(gameId);

      // Check turn changed to player 2
      gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.currentPlayerTurn).to.equal(1); // Player 2's turn

      // Player 2 rolls dice
      await ludoGame.connect(player2).rollDice(gameId);

      // Check turn changed back to player 1
      gameInfo = await ludoGame.getGameInfo(gameId);
      expect(gameInfo.currentPlayerTurn).to.equal(0); // Player 1's turn again
    });

    it("Should return current game for a player", async function () {
      await ludoGame.createGame();
      const gameId = 1;

      await ludoGame.connect(player1).registerPlayer(gameId, "Alice", 0);
      
      const currentGame = await ludoGame.getCurrentGame(player1.address);
      expect(currentGame).to.equal(gameId);
    });
  });
});

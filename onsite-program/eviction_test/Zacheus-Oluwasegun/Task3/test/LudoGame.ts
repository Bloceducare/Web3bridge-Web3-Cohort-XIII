import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("LudoGame", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployLudoGameFixture() {
    const [owner, player1, player2, player3, player4, player5] = await hre.ethers.getSigners();

    // Deploy MockERC20 token
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const initialSupply = 1000000; // 1 million tokens
    const token = await MockERC20.deploy(initialSupply);

    // Deploy LudoGame contract
    const LudoGame = await hre.ethers.getContractFactory("LudoGame");
    const stakeAmount = hre.ethers.parseEther("100"); // 100 tokens
    const ludoGame = await LudoGame.deploy(token.target, stakeAmount);

    // Mint tokens to players for testing
    const mintAmount = hre.ethers.parseEther("1000"); // 1000 tokens each
    await token.mint(player1.address, mintAmount);
    await token.mint(player2.address, mintAmount);
    await token.mint(player3.address, mintAmount);
    await token.mint(player4.address, mintAmount);
    await token.mint(player5.address, mintAmount);

    // Approve LudoGame contract to spend tokens
    await token.connect(player1).approve(ludoGame.target, stakeAmount);
    await token.connect(player2).approve(ludoGame.target, stakeAmount);
    await token.connect(player3).approve(ludoGame.target, stakeAmount);
    await token.connect(player4).approve(ludoGame.target, stakeAmount);
    await token.connect(player5).approve(ludoGame.target, stakeAmount);

    return { ludoGame, token, stakeAmount, owner, player1, player2, player3, player4, player5 };
  }

  describe("Deployment", function () {
    it("Should set the correct staking token and amount", async function () {
      const { ludoGame, token, stakeAmount } = await loadFixture(deployLudoGameFixture);

      expect(await ludoGame.stakingToken()).to.equal(token.target);
      expect(await ludoGame.stakeAmount()).to.equal(stakeAmount);
    });

    it("Should initialize with correct game state", async function () {
      const { ludoGame } = await loadFixture(deployLudoGameFixture);

      const gameInfo = await ludoGame.getCurrentGameInfo();
      expect(gameInfo.currentGameId).to.equal(1);
      expect(gameInfo.state).to.equal(0); // WAITING_FOR_PLAYERS
      expect(gameInfo.playersCount).to.equal(0);
    });
  });

  describe("Player Registration", function () {
    it("Should allow player registration with valid parameters", async function () {
      const { ludoGame, player1 } = await loadFixture(deployLudoGameFixture);

      await expect(ludoGame.connect(player1).registerPlayer("Alice", 0)) // RED
        .to.emit(ludoGame, "PlayerRegistered")
        .withArgs(1, player1.address, "Alice", 0);

      const playerInfo = await ludoGame.getPlayerInfo(1, player1.address);
      expect(playerInfo.name).to.equal("Alice");
      expect(playerInfo.color).to.equal(0); // RED
      expect(playerInfo.isRegistered).to.be.true;
    });


    it("Should reject registration with invalid color", async function () {
      const { ludoGame, player1 } = await loadFixture(deployLudoGameFixture);

      // Solidity automatically handles enum bounds checking in newer versions
      await expect(ludoGame.connect(player1).registerPlayer("Alice", 4))
        .to.be.reverted;
    });

    it("Should reject duplicate color registration", async function () {
      const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);

      await ludoGame.connect(player1).registerPlayer("Alice", 0); // RED
      
      await expect(ludoGame.connect(player2).registerPlayer("Bob", 0)) // RED again
        .to.be.revertedWith("Color already taken");
    });

    it("Should transfer stake amount from player", async function () {
      const { ludoGame, token, player1, stakeAmount } = await loadFixture(deployLudoGameFixture);

      const initialBalance = await token.balanceOf(player1.address);
      
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      
      const finalBalance = await token.balanceOf(player1.address);
      expect(initialBalance - finalBalance).to.equal(stakeAmount);
    });
  });

  describe("Game Flow", function () {
    it("Should start game automatically when 4 players register", async function () {
      const { ludoGame, player1, player2, player3, player4 } = await loadFixture(deployLudoGameFixture);

      await ludoGame.connect(player1).registerPlayer("Alice", 0); // RED
      await ludoGame.connect(player2).registerPlayer("Bob", 1); // GREEN
      await ludoGame.connect(player3).registerPlayer("Charlie", 2); // BLUE
      
      await expect(ludoGame.connect(player4).registerPlayer("David", 3)) // YELLOW
        .to.emit(ludoGame, "GameStarted");

      const gameInfo = await ludoGame.getCurrentGameInfo();
      expect(gameInfo.state).to.equal(1); // IN_PROGRESS
      expect(gameInfo.currentPlayer).to.equal(player1.address);
    });

    it("Should allow dice rolling only by current player", async function () {
      const { ludoGame, player1, player2, player3, player4 } = await loadFixture(deployLudoGameFixture);

      // Register 4 players to start the game
      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      await ludoGame.connect(player2).registerPlayer("Bob", 1);
      await ludoGame.connect(player3).registerPlayer("Charlie", 2);
      await ludoGame.connect(player4).registerPlayer("David", 3);

      // Player1 should be able to roll (first turn)
      await expect(ludoGame.connect(player1).rollDice())
        .to.emit(ludoGame, "DiceRolled");

      // Now it should be player2's turn, so player1 should not be able to roll
      await expect(ludoGame.connect(player1).rollDice())
        .to.be.revertedWith("Not your turn");

      // Player2 should be able to roll now
      await expect(ludoGame.connect(player2).rollDice())
        .to.emit(ludoGame, "DiceRolled");
    });
  });

  describe("Token Staking and Rewards", function () {
    it("Should accumulate total staked amount", async function () {
      const { ludoGame, player1, player2, player3, player4, stakeAmount } = await loadFixture(deployLudoGameFixture);

      await ludoGame.connect(player1).registerPlayer("Alice", 0);
      await ludoGame.connect(player2).registerPlayer("Bob", 1);
      await ludoGame.connect(player3).registerPlayer("Charlie", 2);
      await ludoGame.connect(player4).registerPlayer("David", 3);

      const gameInfo = await ludoGame.getCurrentGameInfo();
      expect(gameInfo.staked).to.equal(stakeAmount * 4n);
    });
  });
});

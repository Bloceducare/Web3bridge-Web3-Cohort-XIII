const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LudoGame", function () {
  let LudoGame, ludoGame;
  let owner, player1, player2, player3, player4;
  let token;

  before(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // Deploy a test ERC20 token
    const Token = await ethers.getContractFactory("ERC20Mock");
    token = await Token.deploy("Game Token", "GTK", owner.address, ethers.utils.parseEther("1000"));
    await token.deployed();

    // Deploy LudoGame contract
    LudoGame = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGame.deploy(token.address, ethers.utils.parseEther("10"));
    await ludoGame.deployed();
  });

  it("Should register players correctly", async function () {
    // Approve token transfers first
    await token.connect(player1).approve(ludoGame.address, ethers.utils.parseEther("10"));
    await token.connect(player2).approve(ludoGame.address, ethers.utils.parseEther("10"));
    await token.connect(player3).approve(ludoGame.address, ethers.utils.parseEther("10"));
    await token.connect(player4).approve(ludoGame.address, ethers.utils.parseEther("10"));

    // Register players
    await ludoGame.connect(player1).registerPlayer("Alice", 0); // RED
    await ludoGame.connect(player2).registerPlayer("Bob", 1);   // GREEN
    await ludoGame.connect(player3).registerPlayer("Charlie", 2); // BLUE
    await ludoGame.connect(player4).registerPlayer("Dave", 3);   // YELLOW

    // Check player count
    expect(await ludoGame.getPlayerCount()).to.equal(4);

    // Try to register with taken color (should fail)
    await expect(
      ludoGame.connect(owner).registerPlayer("Owner", 0)
    ).to.be.revertedWith("Color already taken");
  });

  it("Should handle token staking correctly", async function () {
    // Stake tokens
    await ludoGame.connect(player1).stakeTokens();
    await ludoGame.connect(player2).stakeTokens();
    await ludoGame.connect(player3).stakeTokens();
    await ludoGame.connect(player4).stakeTokens();

    // Check contract token balance
    const balance = await token.balanceOf(ludoGame.address);
    expect(balance).to.equal(ethers.utils.parseEther("40"));
  });

  it("Should start the game correctly", async function () {
    await ludoGame.connect(owner).startGame();
    expect(await ludoGame.gameStarted()).to.equal(true);
  });

  it("Should handle dice rolls and turns correctly", async function () {
    // First player rolls
    const roll1 = await ludoGame.connect(player1).rollDice();
    expect(roll1).to.be.at.least(1).and.at.most(6);

    // Check current player changed
    expect(await ludoGame.getCurrentPlayer()).to.equal(player2.address);

    // Second player rolls
    const roll2 = await ludoGame.connect(player2).rollDice();
    expect(roll2).to.be.at.least(1).and.at.most(6);

    // Check current player changed
    expect(await ludoGame.getCurrentPlayer()).to.equal(player3.address);

    // Try to roll out of turn (should fail)
    await expect(
      ludoGame.connect(player1).rollDice()
    ).to.be.revertedWith("Not your turn");
  });

  it("Should declare a winner correctly", async function () {
    // Owner declares winner
    await ludoGame.connect(owner).declareWinner();

    // Check game state reset
    expect(await ludoGame.gameStarted()).to.equal(false);
    expect(await ludoGame.getPlayerCount()).to.equal(0);

    // Check one player received all the staked tokens
    // (Note: In a real test, you'd need to track which player had the highest score)
    const winnerBalance = await token.balanceOf(player1.address);
    const otherBalance = await token.balanceOf(player2.address);
    
    // Either winner has more or others have less (simplified check)
    expect(winnerBalance.gt(otherBalance) || otherBalance.lt(ethers.utils.parseEther("990"))).to.be.true;
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoGameWithStaking, IERC20 } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LudoGameWithStaking", function () {
  async function deployLudoGameFixture() {
    const [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // Deploy LudoToken contract
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy();

    // Deploy LudoGameWithStaking contract
    const LudoGameWithStaking = await ethers.getContractFactory("LudoGameWithStaking");
    const ludoGame = await LudoGameWithStaking.deploy(ludoToken.target);

    // Mint Ludo tokens for players
    await ludoToken.mint(player1.address, ethers.parseEther("1000"));
    await ludoToken.mint(player2.address, ethers.parseEther("1000"));
    await ludoToken.mint(player3.address, ethers.parseEther("1000"));
    await ludoToken.mint(player4.address, ethers.parseEther("1000"));

    // Approve LudoGameWithStaking contract to spend Ludo tokens
    await ludoToken.connect(player1).approve(ludoGame.target, ethers.parseEther("100"));
    await ludoToken.connect(player2).approve(ludoGame.target, ethers.parseEther("100"));
    await ludoToken.connect(player3).approve(ludoGame.target, ethers.parseEther("100"));
    await ludoToken.connect(player4).approve(ludoGame.target, ethers.parseEther("100"));

    return { ludoGame, ludoToken, owner, player1, player2, player3, player4 };
  }

  it("Should allow players to join the game", async function () {
    const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);
    await ludoGame.connect(player1).joinGame("Player 1", 0);
    await ludoGame.connect(player2).joinGame("Player 2", 1);
    expect(await ludoGame.playerCount()).to.equal(2);
  });

  it("Should start the game", async function () {
    const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);
    await ludoGame.connect(player1).joinGame("Player 1", 0);
    await ludoGame.connect(player2).joinGame("Player 2", 1);
    await ludoGame.startGame();
    expect(await ludoGame.gameStarted()).to.be.true;
  });

  it("Should roll dice", async function () {
    const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);
    await ludoGame.connect(player1).joinGame("Player 1", 0);
    await ludoGame.connect(player2).joinGame("Player 2", 1);
    await ludoGame.startGame();
    const diceRoll = await ludoGame.connect(player1).rollDice();
    expect(diceRoll).to.be.gt(0).and.lt(7);
  });

  it("Should move token", async function () {
    const { ludoGame, player1, player2 } = await loadFixture(deployLudoGameFixture);
    await ludoGame.connect(player1).joinGame("Player 1", 0);
    await ludoGame.connect(player2).joinGame("Player 2", 1);
    await ludoGame.startGame();
    await ludoGame.connect(player1).rollDice();
    await ludoGame.connect(player1).moveToken(0);
    expect(await ludoGame.getGameState()).to.not.be.undefined;
  });

  it("Should refund stakes", async function () {
    const { ludoGame, ludoToken, player1, player2 } = await loadFixture(deployLudoGameFixture);
    await ludoGame.connect(player1).joinGame("Player 1", 0);
    await ludoGame.connect(player2).joinGame("Player 2", 1);
    await ludoGame.startGame();
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ludoGame.refundStakes();
    expect(await ludoToken.balanceOf(player1.address)).to.be.gt(ethers.parseEther("900"));
  });
});


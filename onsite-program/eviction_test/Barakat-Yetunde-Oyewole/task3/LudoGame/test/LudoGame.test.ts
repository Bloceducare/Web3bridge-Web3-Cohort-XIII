import { expect } from "chai";
import { ethers } from "hardhat";
import { LudoToken, LudoGame } from "../typechain-types";

describe("LudoGame", function () {
  let ludoToken: LudoToken;
  let ludoGame: LudoGame;
  let owner: any;
  let player1: any;
  let player2: any;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    
    const LudoToken = await ethers.getContractFactory("LudoToken");
    ludoToken = await LudoToken.deploy();
    await ludoToken.waitForDeployment();
    
    const LudoGame = await ethers.getContractFactory("LudoGame");
    ludoGame = await LudoGame.deploy(await ludoToken.getAddress());
    await ludoGame.waitForDeployment();
    
    // Mint tokens for testing
    await ludoToken.mint(player1.address, ethers.parseEther("1000"));
    await ludoToken.mint(player2.address, ethers.parseEther("1000"));
  });

  it("Should create a game", async function () {
    const entryFee = ethers.parseEther("100");
    
    await ludoToken.connect(player1).approve(await ludoGame.getAddress(), entryFee);
    await ludoGame.connect(player1).createGame(entryFee);
    
    const game = await ludoGame.getGame(1);
    expect(game.players[0]).to.equal(player1.address);
    expect(game.entryFee).to.equal(entryFee);
    expect(game.isActive).to.be.true;
  });

  it("Should allow players to join game", async function () {
    const entryFee = ethers.parseEther("100");
    
    // Create game
    await ludoToken.connect(player1).approve(await ludoGame.getAddress(), entryFee);
    await ludoGame.connect(player1).createGame(entryFee);
    
    // Join game
    await ludoToken.connect(player2).approve(await ludoGame.getAddress(), entryFee);
    await ludoGame.connect(player2).joinGame(1);
    
    const game = await ludoGame.getGame(1);
    expect(game.players[1]).to.equal(player2.address);
  });
});
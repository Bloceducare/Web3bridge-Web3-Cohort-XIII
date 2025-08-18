const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ludo Game Contract", function () {
  
  describe("LudoToken Contract", function () {
  
  it("should deploy with correct initial supply and details", async function () {
    const [owner] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy();
    
    expect(await ludoToken.name()).to.equal("Ludo Game Token");
    expect(await ludoToken.symbol()).to.equal("LUDO");
    expect(await ludoToken.totalSupply()).to.equal(ethers.parseEther("1000000"));
    expect(await ludoToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000"));
  });
  
  it("should allow users to get tokens from faucet", async function () {
    const [user1] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy();
    
    await ludoToken.connect(user1).faucet();
    expect(await ludoToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
  });
  
  it("should prevent users from getting too many tokens from faucet", async function () {
    const [user1] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy();
    
    await ludoToken.connect(user1).faucet();
    await expect(ludoToken.connect(user1).faucet())
    .to.be.revertedWith("Already have enough tokens");
  });
  });

  describe("Game Creation", function () {
  
  it("should create a new game successfully", async function () {
    const [player1] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy();
    
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(ludoToken.target);
    
    await ludoToken.transfer(player1.address, ethers.parseEther("10"));
    await ludoToken.connect(player1).approve(ludoGame.target, ethers.parseEther("1"));
    
    const tx = await ludoGame.connect(player1).createGame(ethers.parseEther("1"), "Player1");
    
    expect(await ludoGame.gameCounter()).to.equal(1);
    await expect(tx)
    .to.emit(ludoGame, "GameCreated")
    .withArgs(0, player1.address, ethers.parseEther("1"));
  });
  
  it("should fail to create game with zero stake", async function () {
    const [player1] = await ethers.getSigners();
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy();
    
    await expect(ludoGame.connect(player1).createGame(0, "Player1"))
    .to.be.revertedWith("Stake must be greater than 0");
  });
  });

  describe("Player Registration and Game Joining", function () {
  
  it("should allow players to join an existing game", async function () {
    const [player1, player2] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy();
    
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(ludoToken.target);
    
    await ludoToken.transfer(player1.address, ethers.parseEther("10"));
    await ludoToken.transfer(player2.address, ethers.parseEther("10"));
    await ludoToken.connect(player1).approve(ludoGame.target, ethers.parseEther("1"));
    await ludoToken.connect(player2).approve(ludoGame.target, ethers.parseEther("1"));
    
    await ludoGame.connect(player1).createGame(ethers.parseEther("1"), "Player1");
    const tx = await ludoGame.connect(player2).joinGame(0, "Player2", 1);
    
    expect(await ludoGame.playerCurrentGame(player2.address)).to.equal(0);
    await expect(tx)
    .to.emit(ludoGame, "PlayerJoined")
    .withArgs(0, player2.address, "Player2", 1);
  });
  
  it("should prevent joining with already taken color", async function () {
    const [player1, player2] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy();
    
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(ludoToken.target);
    
    await ludoToken.transfer(player1.address, ethers.parseEther("10"));
    await ludoToken.transfer(player2.address, ethers.parseEther("10"));
    await ludoToken.connect(player1).approve(ludoGame.target, ethers.parseEther("1"));
    await ludoToken.connect(player2).approve(ludoGame.target, ethers.parseEther("1"));
    
    await ludoGame.connect(player1).createGame(ethers.parseEther("1"), "Player1");
    
    await expect(ludoGame.connect(player2).joinGame(0, "Player2", 0)) // RED already taken
    .to.be.revertedWith("Color already taken");
  });
  });

  describe("Game Flow and Turn Management", function () {
  
  it("should correctly manage turn rotation", async function () {
    const [player1, player2] = await ethers.getSigners();
    const LudoToken = await ethers.getContractFactory("LudoToken");
    const ludoToken = await LudoToken.deploy();
    
    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(ludoToken.target);
    
    await ludoToken.transfer(player1.address, ethers.parseEther("10"));
    await ludoToken.transfer(player2.address, ethers.parseEther("10"));
    await ludoToken.connect(player1).approve(ludoGame.target, ethers.parseEther("1"));
    await ludoToken.connect(player2).approve(ludoGame.target, ethers.parseEther("1"));
    
    await ludoGame.connect(player1).createGame(ethers.parseEther("1"), "Player1");
    await ludoGame.connect(player2).joinGame(0, "Player2", 1);
    await ludoGame.connect(player1).startGame(0);
    
    expect(await ludoGame.connect(player1).isMyTurn(0)).to.be.true;
    await ludoGame.connect(player1).rollDiceAndMove(0);
    expect(await ludoGame.connect(player1).isMyTurn(0)).to.be.false;
    expect(await ludoGame.connect(player2).isMyTurn(0)).to.be.true;
  });
  });
});

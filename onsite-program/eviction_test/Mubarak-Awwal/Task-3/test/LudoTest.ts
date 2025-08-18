const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ludo Game", function () {
    it("should deploy token and game contracts", async function () {
        const [owner, player1, player2, player3, player4] = await ethers.getSigners();
        
        const LudoToken = await ethers.getContractFactory("LudoToken");
        const token = await LudoToken.deploy();
      
        
        const LudoGame = await ethers.getContractFactory("LudoGame");
        const game = await LudoGame.deploy(token.address);
  
        
        expect(await token.name()).to.equal("Ludo Game Token");
        expect(await token.symbol()).to.equal("LUDO");
    });
    
    it("should allow players to get tokens from faucet", async function () {
        const [owner, player1, player2] = await ethers.getSigners();
        
        const LudoToken = await ethers.getContractFactory("LudoToken");
        const token = await LudoToken.deploy();
       
        
        await token.connect(player1).faucet();
        const balance = await token.balanceOf(player1.address);
        expect(balance).to.equal(ethers.parseEther("100"));
    });
    
    it("should create a new game", async function () {
        const [owner, player1] = await ethers.getSigners();
        
        const LudoToken = await ethers.getContractFactory("LudoToken");
        const token = await LudoToken.deploy();
        
        const LudoGame = await ethers.getContractFactory("LudoGame");
        const game = await LudoGame.deploy(token.address);
        
        
        await game.createGame();
        const gameInfo = await game.getGame(1);
        expect(gameInfo.gameId).to.equal(1);
        expect(gameInfo.playerCount).to.equal(0);
    });
    
    it("should register players for a game", async function () {
        const [owner, player1, player2, player3, player4] = await ethers.getSigners();
        
        const LudoToken = await ethers.getContractFactory("LudoToken");
        const token = await LudoToken.deploy();
        
        
        const LudoGame = await ethers.getContractFactory("LudoGame");
        const game = await LudoGame.deploy(token.address);
       
        
        await game.createGame();
        
        await game.connect(player1).registerPlayer(1, "Player1", 0);
        await game.connect(player2).registerPlayer(1, "Player2", 1);
        
        const gameInfo = await game.getGame(1);
        expect(gameInfo.playerCount).to.equal(2);
        expect(gameInfo.players[0].name).to.equal("Player1");
        expect(gameInfo.players[1].name).to.equal("Player2");
    });
    
    it("should not allow same color registration", async function () {
        const [owner, player1, player2] = await ethers.getSigners();
        
        const LudoToken = await ethers.getContractFactory("LudoToken");
        const token = await LudoToken.deploy();
        
        
        const LudoGame = await ethers.getContractFactory("LudoGame");
        const game = await LudoGame.deploy(token.address);
       
        
        await game.createGame();
        
        await game.connect(player1).registerPlayer(1, "Player1", 0);
        
        await expect(
            game.connect(player2).registerPlayer(1, "Player2", 0)
        ).to.be.revertedWith("Color already taken");
    });
    
  
  
    
 
    
   
});
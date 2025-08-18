const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = ethers;

describe('LudoGame', function () {
  let LudoGame, ludoGame;
  let MockToken, mockToken;
  let owner, player1, player2, player3, player4;

  before(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    MockToken = await ethers.getContractFactory('MockToken');
    mockToken = await MockToken.deploy();
    await mockToken.deployed();

    LudoGame = await ethers.getContractFactory('LudoGame');
    ludoGame = await LudoGame.deploy(
      mockToken.address,
      ethers.utils.parseEther('10'),
      1
    );
    await ludoGame.deployed();

    const amount = ethers.utils.parseEther('1000');
    await mockToken.transfer(player1.address, amount);
    await mockToken.transfer(player2.address, amount);
    await mockToken.transfer(player3.address, amount);
    await mockToken.transfer(player4.address, amount);
  });

  describe('Initial Setup', function () {
    it('Should set the right owner', async function () {
      expect(await ludoGame.owners()).to.equal(owner.address);
    });

    it('Should have correct initial game state', async function () {
      expect(await ludoGame.gameState()).to.equal(0);
    });

    it('Should have correct stake amount', async function () {
      expect(await ludoGame.stakeAmount()).to.equal(ethers.utils.parseEther('10'));
    });
  });

  describe('Joining Game', function () {
    it('Should allow players to join', async function () {
      await mockToken.connect(player1).approve(ludoGame.address, ethers.utils.parseEther('10'));
      await mockToken.connect(player2).approve(ludoGame.address, ethers.utils.parseEther('10'));
      
      await ludoGame.connect(player1).joinGame("Alice", 0);
      await ludoGame.connect(player2).joinGame("Bob", 1);

      const players = await ludoGame.getPlayers();
      expect(players.length).to.equal(2);
      expect(players[0].name).to.equal("Alice");
      expect(players[1].name).to.equal("Bob");
    });

    it('Should prevent joining when game is full', async function () {
      await mockToken.connect(player3).approve(ludoGame.address, ethers.utils.parseEther('10'));
      await mockToken.connect(player4).approve(ludoGame.address, ethers.utils.parseEther('10'));
      await ludoGame.connect(player3).joinGame("Charlie", 2);
      await ludoGame.connect(player4).joinGame("Dave", 3);

      await expect(
        ludoGame.connect(owner).joinGame("Eve", 0)
      ).to.be.revertedWith("Game full");
    });

    it('Should prevent duplicate joining', async function () {
      await expect(
        ludoGame.connect(player1).joinGame("Alice", 0)
      ).to.be.revertedWith("Already joined");
    });
  });

  describe('Starting Game', function () {
    it('Should allow owner to start game', async function () {
      await ludoGame.connect(owner).startGame();
      expect(await ludoGame.gameState()).to.equal(1);
      expect(await ludoGame.currentPlayer()).to.equal(player1.address);
    });

    it('Should prevent starting with too few players', async function () {
      const newGame = await LudoGame.deploy(
        mockToken.address,
        ethers.utils.parseEther('10'),
        1
      );
      await expect(
        newGame.connect(owner).startGame()
      ).to.be.revertedWith("Need more players");
    });
  });

  describe('Gameplay', function () {
    it('Should allow current player to roll dice', async function () {
      await expect(ludoGame.connect(player1).rollDice())
        .to.emit(ludoGame, 'DiceRolled')
        .withArgs(player1.address);
    });

    it('Should prevent non-current player from rolling', async function () {
      await expect(
        ludoGame.connect(player2).rollDice()
      ).to.be.revertedWith("Not your turn");
    });

    it('Should update player position and score', async function () {
      const requestId = 1;
      const randomNumber = 3;
      await ludoGame.connect(owner).fulfillRandomWords(requestId, [randomNumber]);

      const players = await ludoGame.getPlayers();
      expect(players[0].position).to.equal(4);
      expect(players[0].score).to.equal(4);
      expect(await ludoGame.currentPlayer()).to.equal(player2.address);
    });

    it('Should declare winner when reaching board end', async function () {
      await ludoGame.connect(owner).setPlayerPosition(player1.address, 28);
      await ludoGame.connect(player1).rollDice();
      
      const requestId = 2;
      const randomNumber = 5;
      await ludoGame.connect(owner).fulfillRandomWords(requestId, [randomNumber]);

      expect(await ludoGame.gameState()).to.equal(2);
      expect(await ludoGame.winner()).to.equal(player1.address);
    });
  });
});
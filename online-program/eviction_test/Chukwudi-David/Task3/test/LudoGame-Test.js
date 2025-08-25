const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("LudoGame", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGame() {

     const stakeAmount = ethers.parseEther("10");
      const goalPosition = 10;

      const [owner, alice, bob, carol] = await ethers.getSigners();
  
      const Token = await ethers.getContractFactory("MyToken");
      const token = await Token.deploy();
  
      // Give some tokens to players
      for (let player of [alice, bob, carol]) {
        await token.mint(player.address, stakeAmount * 2n);
      }
  
      // Deploy game
      const LudoGame = await ethers.getContractFactory("LudoGame");
      const game = await LudoGame.deploy(token.target, stakeAmount, goalPosition, 42);
      await game.waitForDeployment();
  
      // Approve for staking
      for (let player of [alice, bob, carol]) {
        await token.connect(player).approve(await game.target, stakeAmount * 2n);
      }

    return { token, game, owner, alice, bob, carol, stakeAmount, goalPosition };
  }

  describe("Testing Ludo game", function () {
    it("1) Players can register with unique colors and stake is transferred", async () => {
      const { game, alice, bob, token, stakeAmount } = await loadFixture(deployGame);

      await expect(game.connect(alice).register("Alice", 1)) // RED
        .to.emit(game, "PlayerRegistered");

      await expect(game.connect(bob).register("Bob", 2)) // GREEN
        .to.emit(game, "PlayerRegistered");

      expect(await token.balanceOf(await game.getAddress())).to.equal(stakeAmount * 2n);

      const players = await game.getPlayers();
      expect(players).to.deep.equal([alice.address, bob.address]);
    });

    it("2) Cannot register with same color or twice", async () => {
      const { game, alice, bob } = await loadFixture(deployGame);

      await game.connect(alice).register("Alice", 1);

      await expect(game.connect(bob).register("Bob", 1)).to.be.revertedWith("Color already taken");
      await expect(game.connect(alice).register("AliceAgain", 2)).to.be.revertedWith("Already registered");
    });

    it("3) Game can start only with >=2 players", async () => {
      const { game, alice, bob } = await loadFixture(deployGame);

      await game.connect(alice).register("Alice", 1);
      await expect(game.startGame()).to.be.revertedWith("Need at least 2 players");

      await game.connect(bob).register("Bob", 2);
      await expect(game.startGame())
        .to.emit(game, "GameStarted");
      expect(await game.started()).to.equal(true);
    });

    it("4) Turn-based dice rolling and movement works", async () => {
      const { game, alice, bob } = await loadFixture(deployGame);

      await game.connect(alice).register("Alice", 1);
      await game.connect(bob).register("Bob", 2);
      await game.startGame();

      // First turn = Alice
      await expect(game.connect(alice).rollDice())
        .to.emit(game, "DiceRolled");

      // Bob next
      await expect(game.connect(bob).rollDice())
        .to.emit(game, "DiceRolled");

      // Alice cannot roll twice in a row
      await expect(game.connect(bob).rollDice()).to.be.revertedWith("Not your turn");
    });

    it("5) Player reaching goal is declared winner, prize distributed", async () => {
      const { game, alice, bob, token, goalPosition, stakeAmount } = await loadFixture(deployGame);

      await game.connect(alice).register("Alice", 1);
      await game.connect(bob).register("Bob", 2);
      await game.startGame();

      // Force Alice close to goal
      await game.setSeed(1); // deterministic
      let info = await game.getPlayerInfo(alice.address);
      expect(info[2]).to.equal(0);

      // Manually simulate moves until Alice reaches or exceeds goal
      while ((await game.getPlayerInfo(alice.address))[2] < goalPosition) {
        const currentTurn = await game.playerOrder(await game.currentTurnIndex());
        if (currentTurn === alice.address) {
          await game.connect(alice).rollDice();
        } else {
          await game.connect(bob).rollDice();
        }
      }

      const winner = await game.winner();
      expect(winner).to.equal(alice.address);

      // Winner gets prize
      const totalStake = stakeAmount * 2n;
      expect(await token.balanceOf(alice.address)).to.be.greaterThan(totalStake);
      expect(await token.balanceOf(await game.getAddress())).to.equal(0);
    });

  });

});

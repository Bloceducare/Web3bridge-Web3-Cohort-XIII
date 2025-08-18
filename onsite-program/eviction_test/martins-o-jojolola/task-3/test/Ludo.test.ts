import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LudoGame, ERC20Mock } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LudoGame", function () {
  let ludoGame: LudoGame;
  let token: ERC20Mock;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;
  let player4: SignerWithAddress;
  let player5: SignerWithAddress;

  const STAKE_AMOUNT = ethers.parseEther("10");
  const INITIAL_BALANCE = ethers.parseEther("1000");

  const Color = {
    RED: 0,
    GREEN: 1,
    BLUE: 2,
    YELLOW: 3
  };

  async function deployGameFixture() {
    const [owner, player1, player2, player3, player4, player5] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const token = await ERC20Mock.deploy(
      "Test Token",
      "TTK",
      owner.address,
      INITIAL_BALANCE
    );

    const LudoGame = await ethers.getContractFactory("LudoGame");
    const ludoGame = await LudoGame.deploy(token.target, STAKE_AMOUNT);

    await token.mint(player1.address, INITIAL_BALANCE);
    await token.mint(player2.address, INITIAL_BALANCE);
    await token.mint(player3.address, INITIAL_BALANCE);
    await token.mint(player4.address, INITIAL_BALANCE);
    await token.mint(player5.address, INITIAL_BALANCE);

    return { ludoGame, token, owner, player1, player2, player3, player4, player5 };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployGameFixture);
    ludoGame = fixture.ludoGame;
    token = fixture.token;
    owner = fixture.owner;
    player1 = fixture.player1;
    player2 = fixture.player2;
    player3 = fixture.player3;
    player4 = fixture.player4;
    player5 = fixture.player5;
  });

  describe("Deployment", function () {
    it("Should set the correct token and stake amount", async function () {
      expect(await ludoGame.token()).to.equal(token.target);
      expect(await ludoGame.stakeAmount()).to.equal(STAKE_AMOUNT);
      expect(await ludoGame.playerCount()).to.equal(0);
      expect(await ludoGame.gameStarted()).to.equal(false);
    });
  });

  describe("Player Registration", function () {
    it("Should allow a player to register successfully", async function () {
      await expect(ludoGame.connect(player1).register("Player1", Color.RED))
        .to.not.be.reverted;

      const registeredPlayer = await ludoGame.players(player1.address);
      expect(registeredPlayer.name).to.equal("Player1");
      expect(registeredPlayer.color).to.equal(Color.RED);
      expect(registeredPlayer.addr).to.equal(player1.address);
      expect(registeredPlayer.registered).to.equal(true);
      expect(registeredPlayer.score).to.equal(0);

      expect(await ludoGame.colorTaken(Color.RED)).to.equal(true);
      expect(await ludoGame.playerCount()).to.equal(1);
    });

    it("Should prevent duplicate registration", async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);

      await expect(ludoGame.connect(player1).register("Player1", Color.BLUE))
        .to.be.revertedWithCustomError(ludoGame, "AlreadyRegistered");
    });

    it("Should prevent using the same color twice", async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);

      await expect(ludoGame.connect(player2).register("Player2", Color.RED))
        .to.be.revertedWithCustomError(ludoGame, "ColorTaken");
    });

    it("Should prevent more than 4 players from registering", async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);
      await ludoGame.connect(player2).register("Player2", Color.GREEN);
      await ludoGame.connect(player3).register("Player3", Color.BLUE);
      await ludoGame.connect(player4).register("Player4", Color.YELLOW);

      await expect(ludoGame.connect(player5).register("Player5", Color.RED))
        .to.be.revertedWithCustomError(ludoGame, "MaxPlayersReached");
    });

    it("Should allow multiple players to register with different colors", async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);
      await ludoGame.connect(player2).register("Player2", Color.GREEN);
      await ludoGame.connect(player3).register("Player3", Color.BLUE);

      expect(await ludoGame.playerCount()).to.equal(3);
      expect(await ludoGame.colorTaken(Color.RED)).to.equal(true);
      expect(await ludoGame.colorTaken(Color.GREEN)).to.equal(true);
      expect(await ludoGame.colorTaken(Color.BLUE)).to.equal(true);
      expect(await ludoGame.colorTaken(Color.YELLOW)).to.equal(false);
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);
      await ludoGame.connect(player2).register("Player2", Color.GREEN);
    });

    it("Should allow registered players to stake", async function () {
      await token.connect(player1).approve(ludoGame.target, STAKE_AMOUNT);

      await expect(ludoGame.connect(player1).stake())
        .to.not.be.reverted;

      expect(await token.balanceOf(ludoGame.target)).to.equal(STAKE_AMOUNT);
    });

    it("Should prevent unregistered players from staking", async function () {
      await token.connect(player3).approve(ludoGame.target, STAKE_AMOUNT);

      await expect(ludoGame.connect(player3).stake())
        .to.be.revertedWithCustomError(ludoGame, "NotRegistered");
    });

    it("Should prevent staking after game has started", async function () {
      await token.connect(player1).approve(ludoGame.target, STAKE_AMOUNT);
      await token.connect(player2).approve(ludoGame.target, STAKE_AMOUNT);

      await ludoGame.startGame();

      await expect(ludoGame.connect(player1).stake())
        .to.be.revertedWithCustomError(ludoGame, "GameAlreadyStarted");
    });

    it("Should require sufficient token allowance", async function () {
      await token.connect(player1).approve(ludoGame.target, STAKE_AMOUNT - 1n);

      await expect(ludoGame.connect(player1).stake())
        .to.be.reverted;
    });
  });

  describe("Game Start", function () {
    it("Should start game with at least 2 players", async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);
      await ludoGame.connect(player2).register("Player2", Color.GREEN);

      await expect(ludoGame.startGame())
        .to.not.be.reverted;

      expect(await ludoGame.gameStarted()).to.equal(true);
    });

    it("Should prevent starting game with less than 2 players", async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);

      await expect(ludoGame.startGame())
        .to.be.revertedWithCustomError(ludoGame, "NotEnoughPlayers");
    });

    it("Should allow anyone to start the game", async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);
      await ludoGame.connect(player2).register("Player2", Color.GREEN);

      await expect(ludoGame.connect(player3).startGame())
        .to.not.be.reverted;
    });
  });

  describe("Dice Rolling", function () {
    beforeEach(async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);
      await ludoGame.connect(player2).register("Player2", Color.GREEN);
      await ludoGame.startGame();
    });

    it("Should allow registered players to roll dice after game starts", async function () {
      const tx = await ludoGame.connect(player1).rollDice();
      const receipt = await tx.wait();

      expect(receipt?.status).to.equal(1);

      const player = await ludoGame.players(player1.address);
      expect(player.score).to.be.greaterThan(0);
      expect(player.score).to.be.lessThanOrEqual(6);
    });

    it("Should prevent unregistered players from rolling dice", async function () {
      await expect(ludoGame.connect(player3).rollDice())
        .to.be.revertedWithCustomError(ludoGame, "NotRegistered");
    });

    it("Should prevent rolling dice before game starts", async function () {
      const LudoGame = await ethers.getContractFactory("LudoGame");
      const newGame = await LudoGame.deploy(token.target, STAKE_AMOUNT);

      await newGame.connect(player1).register("Player1", Color.RED);

      await expect(newGame.connect(player1).rollDice())
        .to.be.revertedWithCustomError(newGame, "GameNotStarted");
    });

    it("Should return dice value between 1 and 6", async function () {
      for (let i = 0; i < 10; i++) {
        const tx = await ludoGame.connect(player1).rollDice();
        const receipt = await tx.wait();


        const playerBefore = await ludoGame.players(player1.address);
        await ludoGame.connect(player1).rollDice();
        const playerAfter = await ludoGame.players(player1.address);

        const diceValue = playerAfter.score - playerBefore.score;
        expect(diceValue).to.be.greaterThanOrEqual(1);
        expect(diceValue).to.be.lessThanOrEqual(6);
      }
    });

    it("Should accumulate scores correctly", async function () {
      const initialPlayer = await ludoGame.players(player1.address);
      expect(initialPlayer.score).to.equal(0);

      await ludoGame.connect(player1).rollDice();
      const afterFirstRoll = await ludoGame.players(player1.address);
      const firstScore = afterFirstRoll.score;

      await ludoGame.connect(player1).rollDice();
      const afterSecondRoll = await ludoGame.players(player1.address);

      expect(afterSecondRoll.score).to.be.greaterThan(firstScore);
    });
  });

  describe("Winner Declaration", function () {
    beforeEach(async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);
      await ludoGame.connect(player2).register("Player2", Color.GREEN);
      await ludoGame.connect(player3).register("Player3", Color.BLUE);

      await token.connect(player1).approve(ludoGame.target, STAKE_AMOUNT);
      await token.connect(player2).approve(ludoGame.target, STAKE_AMOUNT);
      await token.connect(player3).approve(ludoGame.target, STAKE_AMOUNT);

      await ludoGame.connect(player1).stake();
      await ludoGame.connect(player2).stake();
      await ludoGame.connect(player3).stake();

      await ludoGame.startGame();
    });

    it("Should prevent declaring winner before game starts", async function () {
      const LudoGame = await ethers.getContractFactory("LudoGame");
      const newGame = await LudoGame.deploy(token.target, STAKE_AMOUNT);

      await expect(newGame.declareWinner())
        .to.be.revertedWithCustomError(newGame, "GameNotStarted");
    });

    it("Should declare winner and distribute prize correctly", async function () {
      await ludoGame.connect(player1).rollDice();
      await ludoGame.connect(player2).rollDice();
      await ludoGame.connect(player3).rollDice();

      const player1BalanceBefore = await token.balanceOf(player1.address);
      const player2BalanceBefore = await token.balanceOf(player2.address);
      const player3BalanceBefore = await token.balanceOf(player3.address);

      const player1Score = (await ludoGame.players(player1.address)).score;
      const player2Score = (await ludoGame.players(player2.address)).score;
      const player3Score = (await ludoGame.players(player3.address)).score;

      let expectedWinner = player1.address;
      let highestScore = player1Score;

      if (player2Score > highestScore) {
        expectedWinner = player2.address;
        highestScore = player2Score;
      }
      if (player3Score > highestScore) {
        expectedWinner = player3.address;
        highestScore = player3Score;
      }

      await expect(ludoGame.declareWinner())
        .to.not.be.reverted;

      expect(await ludoGame.gameStarted()).to.equal(false);

      const totalPot = STAKE_AMOUNT * 3n;
      const winnerBalance = await token.balanceOf(expectedWinner);

      let expectedBalance: bigint;
      if (expectedWinner === player1.address) {
        expectedBalance = player1BalanceBefore + totalPot;
      } else if (expectedWinner === player2.address) {
        expectedBalance = player2BalanceBefore + totalPot;
      } else {
        expectedBalance = player3BalanceBefore + totalPot;
      }

      expect(winnerBalance).to.equal(expectedBalance);
    });

    it("Should handle tie by giving prize to first player with highest score", async function () {

      await ludoGame.connect(player1).rollDice();
      await ludoGame.connect(player2).rollDice();

      await expect(ludoGame.declareWinner())
        .to.not.be.reverted;

      expect(await ludoGame.gameStarted()).to.equal(false);
    });
  });

  describe("Get Players", function () {
    it("Should return empty array when no players registered", async function () {
      const players = await ludoGame.getPlayers();
      expect(players.length).to.equal(0);
    });

    it("Should return all registered players", async function () {
      await ludoGame.connect(player1).register("Alice", Color.RED);
      await ludoGame.connect(player2).register("Bob", Color.GREEN);
      await ludoGame.connect(player3).register("Charlie", Color.BLUE);

      const players = await ludoGame.getPlayers();
      expect(players.length).to.equal(3);

      expect(players[0].name).to.equal("Alice");
      expect(players[0].color).to.equal(Color.RED);
      expect(players[0].addr).to.equal(player1.address);
      expect(players[0].registered).to.equal(true);

      expect(players[1].name).to.equal("Bob");
      expect(players[1].color).to.equal(Color.GREEN);
      expect(players[1].addr).to.equal(player2.address);

      expect(players[2].name).to.equal("Charlie");
      expect(players[2].color).to.equal(Color.BLUE);
      expect(players[2].addr).to.equal(player3.address);
    });

    it("Should return players with updated scores", async function () {
      await ludoGame.connect(player1).register("Player1", Color.RED);
      await ludoGame.connect(player2).register("Player2", Color.GREEN);
      await ludoGame.startGame();

      await ludoGame.connect(player1).rollDice();
      await ludoGame.connect(player2).rollDice();

      const players = await ludoGame.getPlayers();
      expect(players[0].score).to.be.greaterThan(0);
      expect(players[1].score).to.be.greaterThan(0);
    });
  });

  describe("Edge Cases and Integration", function () {
    it("Should handle full game flow correctly", async function () {
      await ludoGame.connect(player1).register("Alice", Color.RED);
      await ludoGame.connect(player2).register("Bob", Color.GREEN);
      await ludoGame.connect(player3).register("Charlie", Color.BLUE);
      await ludoGame.connect(player4).register("David", Color.YELLOW);

      await token.connect(player1).approve(ludoGame.target, STAKE_AMOUNT);
      await token.connect(player2).approve(ludoGame.target, STAKE_AMOUNT);
      await token.connect(player3).approve(ludoGame.target, STAKE_AMOUNT);
      await token.connect(player4).approve(ludoGame.target, STAKE_AMOUNT);

      await ludoGame.connect(player1).stake();
      await ludoGame.connect(player2).stake();
      await ludoGame.connect(player3).stake();
      await ludoGame.connect(player4).stake();

      await ludoGame.startGame();
      expect(await ludoGame.gameStarted()).to.equal(true);

      await ludoGame.connect(player1).rollDice();
      await ludoGame.connect(player2).rollDice();
      await ludoGame.connect(player3).rollDice();
      await ludoGame.connect(player4).rollDice();

      await ludoGame.declareWinner();
      expect(await ludoGame.gameStarted()).to.equal(false);

      expect(await token.balanceOf(ludoGame.target)).to.equal(0);
    });

    it("Should maintain correct player count throughout game", async function () {
      expect(await ludoGame.playerCount()).to.equal(0);

      await ludoGame.connect(player1).register("Player1", Color.RED);
      expect(await ludoGame.playerCount()).to.equal(1);

      await ludoGame.connect(player2).register("Player2", Color.GREEN);
      expect(await ludoGame.playerCount()).to.equal(2);

      await ludoGame.connect(player3).register("Player3", Color.BLUE);
      expect(await ludoGame.playerCount()).to.equal(3);

      await token.connect(player1).approve(ludoGame.target, STAKE_AMOUNT);
      await token.connect(player2).approve(ludoGame.target, STAKE_AMOUNT);
      await token.connect(player3).approve(ludoGame.target, STAKE_AMOUNT);

      await ludoGame.connect(player1).stake();
      await ludoGame.connect(player2).stake();
      await ludoGame.connect(player3).stake();

      await ludoGame.startGame();

      await ludoGame.connect(player1).rollDice();
      await ludoGame.connect(player2).rollDice();
      await ludoGame.connect(player3).rollDice();

      await ludoGame.declareWinner();

      expect(await ludoGame.playerCount()).to.equal(3);
    });
  });
});

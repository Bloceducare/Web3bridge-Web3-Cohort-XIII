import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Ludo Contract", function () {
  async function deployLudoFixture() {
    const [owner, player1, player2, player3, player4] = await hre.ethers.getSigners();
    const Ludo = await hre.ethers.getContractFactory("Ludo");
    const ludo = await Ludo.deploy();
    return { ludo, owner, player1, player2, player3, player4 };
  }

  async function twoPlayerGameFixture() {
    const { ludo, player1, player2 } = await loadFixture(deployLudoFixture);
    await ludo.connect(player1).joinGame();
    await ludo.connect(player2).joinGame();
    await ludo.connect(player1).startGame();
    return { ludo, player1, player2 };
  }

  describe("Game Setup", function () {
    it("Should allow players to join", async function () {
      const { ludo, player1 } = await loadFixture(deployLudoFixture);
      await expect(ludo.connect(player1).joinGame())
        .to.emit(ludo, "GameStarted")
        .not.to.be.reverted;
    });

    it("Should prevent joining when game is full", async function () {
      const { ludo, player1, player2, player3, player4 } = await loadFixture(deployLudoFixture);
      await ludo.connect(player1).joinGame();
      await ludo.connect(player2).joinGame();
      await ludo.connect(player3).joinGame();
      await ludo.connect(player4).joinGame();
      await expect(ludo.connect(player1).joinGame())
        .to.be.revertedWith("Game is full");
    });
  });

  describe("Game Start", function () {
    it("Should require at least 2 players to start", async function () {
      const { ludo, player1 } = await loadFixture(deployLudoFixture);
      await ludo.connect(player1).joinGame();
      await expect(ludo.connect(player1).startGame())
        .to.be.revertedWith("Not enough players");
    });

    it("Should correctly start the game", async function () {
      const { ludo, player1, player2 } = await loadFixture(deployLudoFixture);
      await ludo.connect(player1).joinGame();
      await ludo.connect(player2).joinGame();
      await expect(ludo.connect(player1).startGame())
        .to.emit(ludo, "GameStarted");
    });
  });

  describe("Gameplay", function () {
    it("Should only allow current player to roll dice", async function () {
      const { ludo, player1, player2 } = await loadFixture(twoPlayerGameFixture);
      await expect(ludo.connect(player2).rollDice())
        .to.be.revertedWith("Not your turn");
    });

    it("Should move token correctly with a 6", async function () {
      const { ludo, player1 } = await loadFixture(twoPlayerGameFixture);
      // Mock dice roll to return 6
      await hre.network.provider.send("hardhat_setStorageAt", [
        ludo.target,
        "0x3", // nonce storage slot
        "0x0000000000000000000000000000000000000000000000000000000000000005" // Will return 6 (5+1)
      ]);
      
      const roll = await ludo.connect(player1).rollDice();
      expect(roll).to.equal(6);
      
      await expect(ludo.connect(player1).moveToken(0, 6))
        .to.emit(ludo, "TokenMoved");
    });

    it("Should detect player win condition", async function () {
      const { ludo, player1 } = await loadFixture(twoPlayerGameFixture);
      // Set all tokens to home position (simulate win)
      await hre.network.provider.send("hardhat_setStorageAt", [
        ludo.target,
        "0x1", // players array storage slot
        "0x0000000000000000000000000000000400000000000000000000000000000000" // tokensHome = 4
      ]);
      
      await expect(ludo.connect(player1).moveToken(0, 1))
        .to.emit(ludo, "PlayerWon");
    });
  });
});
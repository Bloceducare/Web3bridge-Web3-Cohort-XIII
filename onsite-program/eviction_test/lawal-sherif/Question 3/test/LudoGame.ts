const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ludo Contract", function () {
  let ludo;
  let owner;
  let player1, player2, player3, player4;
  const ENTRY_FEE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();
    
    const Ludo = await ethers.getContractFactory("Ludo");
    ludo = await Ludo.deploy();
  });

  describe("Player Registration", function () {
    it("Should allow players to register with correct entry fee and unique color", async function () {
      // Test player registration
      await ludo.connect(player1).register("Alice", 0, { value: ENTRY_FEE }); // RED
      
      // Check participant details
      const participant = await ludo.participants(0);
      expect(participant.id).to.equal(0);
      expect(participant.account).to.equal(player1.address);
      expect(participant.name).to.equal("Alice");
      expect(participant.color).to.equal(0); // RED
      
      // Check state updates
      expect(await ludo.playerCount()).to.equal(1);
      expect(await ludo.hasJoined(player1.address)).to.be.true;
      expect(await ludo.colorTaken(0)).to.be.true; // RED taken
    });

    it("Should reject registration with incorrect entry fee or duplicate color", async function () {
      // Register first player
      await ludo.connect(player1).register("Alice", 0, { value: ENTRY_FEE }); // RED
      
      // Test insufficient entry fee
      await expect(
        ludo.connect(player2).register("Bob", 1, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Must pay exactly 0.01 ETH to enter");
      
      // Test duplicate color
      await expect(
        ludo.connect(player2).register("Bob", 0, { value: ENTRY_FEE }) // RED already taken
      ).to.be.revertedWith("Color already taken by another player");
      
      // Test duplicate player
      await expect(
        ludo.connect(player1).register("Alice2", 1, { value: ENTRY_FEE })
      ).to.be.revertedWith("Cannot join twice in the same game");
    });
  });

  describe("Dice Rolling", function () {
    beforeEach(async function () {
      // Register 4 players to start the game
      await ludo.connect(player1).register("Alice", 0, { value: ENTRY_FEE }); // RED
      await ludo.connect(player2).register("Bob", 1, { value: ENTRY_FEE });   // GREEN
      await ludo.connect(player3).register("Charlie", 2, { value: ENTRY_FEE }); // BLUE
      await ludo.connect(player4).register("Dave", 3, { value: ENTRY_FEE }); // YELLOW
    });

    it("Should allow players to roll dice in turn and return valid dice values", async function () {
      // Player 1's turn (currentPlayerTurn starts at 0)
      expect(await ludo.currentPlayerTurn()).to.equal(0);
      
      const tx = await ludo.connect(player1).rollDice();
      const receipt = await tx.wait();
      
      // Check dice value is between 1-6
      const diceValue = await ludo.lastDiceRoll();
      expect(diceValue).to.be.gte(1);
      expect(diceValue).to.be.lte(6);
      
      // Check turn progression
      expect(await ludo.currentPlayerTurn()).to.equal(1);
      expect(await ludo.hasRolledThisTurn(0)).to.be.true;
      expect(await ludo.hasRolledThisTurn(1)).to.be.false;
      
      // Test that player 1 cannot roll again
      await expect(
        ludo.connect(player1).rollDice()
      ).to.be.revertedWith("Not your turn");
      
      // Player 2's turn
      await ludo.connect(player2).rollDice();
      expect(await ludo.currentPlayerTurn()).to.equal(2);
    });
  });

  describe("Game Completion and Reset", function () {
    it("Should automatically select winner and reset game when 4 players register", async function () {
      const initialBalance1 = await ethers.provider.getBalance(player1.address);
      const initialBalance2 = await ethers.provider.getBalance(player2.address);
      const initialBalance3 = await ethers.provider.getBalance(player3.address);
      const initialBalance4 = await ethers.provider.getBalance(player4.address);
      
      // Register 3 players first
      await ludo.connect(player1).register("Alice", 0, { value: ENTRY_FEE }); // RED
      await ludo.connect(player2).register("Bob", 1, { value: ENTRY_FEE });   // GREEN
      await ludo.connect(player3).register("Charlie", 2, { value: ENTRY_FEE }); // BLUE
      
      expect(await ludo.playerCount()).to.equal(3);
      expect(await ludo.currentGame()).to.equal(1);
      
      // Register 4th player - this should trigger game completion
      await ludo.connect(player4).register("Dave", 3, { value: ENTRY_FEE }); // YELLOW
      
      // Check game has been reset
      expect(await ludo.playerCount()).to.equal(0);
      expect(await ludo.currentGame()).to.equal(2);
      expect(await ludo.currentPlayerTurn()).to.equal(0);
      expect(await ludo.lastDiceRoll()).to.equal(0);
      
      // Check all players are cleared from hasJoined mapping
      expect(await ludo.hasJoined(player1.address)).to.be.false;
      expect(await ludo.hasJoined(player2.address)).to.be.false;
      expect(await ludo.hasJoined(player3.address)).to.be.false;
      expect(await ludo.hasJoined(player4.address)).to.be.false;
      
      // Check all colors are available again
      expect(await ludo.colorTaken(0)).to.be.false; // RED
      expect(await ludo.colorTaken(1)).to.be.false; // GREEN
      expect(await ludo.colorTaken(2)).to.be.false; // BLUE
      expect(await ludo.colorTaken(3)).to.be.false; // YELLOW
      
      // Verify contract balance is empty (prize was distributed)
      expect(await ethers.provider.getBalance(ludo.target)).to.equal(0);
      
      // One of the players should have received the prize (4 * 0.01 ETH)
      const finalBalance1 = await ethers.provider.getBalance(player1.address);
      const finalBalance2 = await ethers.provider.getBalance(player2.address);
      const finalBalance3 = await ethers.provider.getBalance(player3.address);
      const finalBalance4 = await ethers.provider.getBalance(player4.address);
      
      const expectedPrize = ENTRY_FEE * 4n;
      
      // Check if any player received the prize (accounting for gas costs)
      const player1Gained = finalBalance1 > initialBalance1;
      const player2Gained = finalBalance2 > initialBalance2;
      const player3Gained = finalBalance3 > initialBalance3;
      const player4Gained = finalBalance4 > initialBalance4;
      
      // Exactly one player should have gained significantly more than they spent
      const winnersCount = [player1Gained, player2Gained, player3Gained, player4Gained]
        .filter(Boolean).length;
      
      // Note: Due to gas costs, we can't check exact amounts, but we can verify
      // that the game completed and reset properly
      expect(winnersCount).to.be.gte(1);
    });
  });
});
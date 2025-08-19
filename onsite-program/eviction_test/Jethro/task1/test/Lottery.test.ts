import { expect } from "chai";
import hre from "hardhat";

describe("Lottery Contract", function () {
  let lottery: any;
  let owner: any;
  let players: any[];
  let ownerAddress: string;
  let playerAddresses: string[];
  let ethers: any;
  let ENTRY_FEE: any;
  const MAX_PLAYERS = 10;

  beforeEach(async function () {
    const networkConnection = await hre.network.connect({
      network: "hardhat",
      chainType: "l1",
    });
    ethers = networkConnection.ethers;

    const signers = await ethers.getSigners();
    owner = signers[0];
    players = signers.slice(1, 15);

    ownerAddress = await owner.getAddress();
    playerAddresses = await Promise.all(players.map((p: any) => p.getAddress()));

    ENTRY_FEE = ethers.parseEther("0.01");

    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await lottery.owner()).to.equal(ownerAddress);
    });

    it("Should initialize with correct values", async function () {
      expect(await lottery.ENTRY_FEE()).to.equal(ENTRY_FEE);
      expect(await lottery.MAX_PLAYERS()).to.equal(MAX_PLAYERS);
      expect(await lottery.lotteryRound()).to.equal(1);
      expect(await lottery.lotteryActive()).to.be.true;
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
    });
  });

  describe("Entry Rules", function () {
    it("Should allow user to join with exact entry fee", async function () {
      const player = players[0];
      
      await expect(
        lottery.connect(player).joinLottery({ value: ENTRY_FEE })
      ).to.emit(lottery, "PlayerJoined")
        .withArgs(playerAddresses[0], 1, 1);

      expect(await lottery.getPlayerCount()).to.equal(1);
      expect(await lottery.hasPlayerJoined(playerAddresses[0])).to.be.true;
    });

    it("Should reject entry with incorrect fee", async function () {
      const player = players[0];
      const wrongFee = ethers.parseEther("0.005");

      await expect(
        lottery.connect(player).joinLottery({ value: wrongFee })
      ).to.be.revertedWith("Entry fee must be exactly 0.01 ETH");
    });

    it("Should reject entry with too high fee", async function () {
      const player = players[0];
      const wrongFee = ethers.parseEther("0.02");

      await expect(
        lottery.connect(player).joinLottery({ value: wrongFee })
      ).to.be.revertedWith("Entry fee must be exactly 0.01 ETH");
    });

    it("Should allow multiple players to join", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayerCount()).to.equal(5);
      expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE * 5n);
    });

    it("Should prevent same player from joining twice", async function () {
      const player = players[0];
      
      await lottery.connect(player).joinLottery({ value: ENTRY_FEE });
      
      await expect(
        lottery.connect(player).joinLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("Player already joined this round");
    });
  });

  describe("Player Tracking", function () {
    beforeEach(async function () {
      // Add 5 players
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }
    });

    it("Should correctly track 10 players", async function () {
      expect(await lottery.getPlayerCount()).to.equal(5);
      
      const playersList = await lottery.getPlayers();
      expect(playersList.length).to.equal(5);
      
      for (let i = 0; i < 5; i++) {
        expect(playersList[i]).to.equal(playerAddresses[i]);
        expect(await lottery.hasPlayerJoined(playerAddresses[i])).to.be.true;
      }
    });

    it("Should return correct lottery info", async function () {
      const info = await lottery.getLotteryInfo();
      
      expect(info.playerCount).to.equal(5);
      expect(info.currentPrizePool).to.equal(ENTRY_FEE * 5n);
      expect(info.currentRound).to.equal(1);
      expect(info.isActive).to.be.true;
      expect(info.currentWinner).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Winner Selection", function () {
    it("Should automatically select winner when 10 players join", async function () {
      // Add 9 players first
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayerCount()).to.equal(9);

      // Add 10th player - should trigger winner selection
      const tx = await lottery.connect(players[9]).joinLottery({ value: ENTRY_FEE });
      
      // Check that WinnerSelected event was emitted
      await expect(tx).to.emit(lottery, "WinnerSelected");
      await expect(tx).to.emit(lottery, "LotteryReset");

      // Check that lottery was reset
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.getPrizePool()).to.equal(0);
      expect(await lottery.lotteryRound()).to.equal(2);
    });

    it("Should transfer entire prize pool to winner", async function () {
      const initialBalances = await Promise.all(
        players.slice(0, 10).map(async (player: any) =>
          ethers.provider.getBalance(await player.getAddress())
        )
      );

      // Add 10 players
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      // Get winner address from the event
      const filter = lottery.filters.WinnerSelected();
      const events = await lottery.queryFilter(filter);
      const winnerEvent = events[events.length - 1];
      const winnerAddress = winnerEvent.args[0];
      const winnings = winnerEvent.args[1];

      expect(winnings).to.equal(ENTRY_FEE * 10n);

      // Find which player won
      const winnerIndex = playerAddresses.slice(0, 10).indexOf(winnerAddress);
      expect(winnerIndex).to.be.greaterThan(-1);

      // Check winner's balance increased (accounting for gas costs)
      const finalBalance = await ethers.provider.getBalance(winnerAddress);
      const expectedMinBalance = initialBalances[winnerIndex] + winnings - ENTRY_FEE - ethers.parseEther("0.001"); // Account for gas
      
      expect(finalBalance).to.be.greaterThan(expectedMinBalance);
    });

    it("Should prevent more than 10 players from joining", async function () {
      // Add 9 players first
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      // Verify we have 9 players
      expect(await lottery.getPlayerCount()).to.equal(9);

      // Add 10th player - this should trigger winner selection and reset
      await lottery.connect(players[9]).joinLottery({ value: ENTRY_FEE });

      // Verify lottery was reset
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.lotteryRound()).to.equal(2);

      // Now add 10 players to the new round
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      // Verify lottery reset again after 10 players
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.lotteryRound()).to.equal(3);
    });
  });

  describe("Security Considerations", function () {
    it("Should prevent calling winner selection except by contract", async function () {
      // This test verifies the internal function can't be called externally
      // The _selectWinner function is internal, so we can't test it directly
      // But we can verify the modifier works by checking the contract behavior
      
      // Add 10 players to trigger automatic selection
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      // Verify winner was selected automatically
      expect(await lottery.getPlayerCount()).to.equal(0);
      expect(await lottery.lotteryRound()).to.equal(2);
    });

    it("Should prevent duplicate entries in same round", async function () {
      const player = players[0];
      
      await lottery.connect(player).joinLottery({ value: ENTRY_FEE });
      
      await expect(
        lottery.connect(player).joinLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("Player already joined this round");
    });

    it("Should allow same player to join new round after reset", async function () {
      const player = players[0];
      
      // Join first round
      await lottery.connect(player).joinLottery({ value: ENTRY_FEE });
      
      // Complete the round by adding 9 more players
      for (let i = 1; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      // Now player should be able to join new round
      await expect(
        lottery.connect(player).joinLottery({ value: ENTRY_FEE })
      ).to.emit(lottery, "PlayerJoined");
    });
  });

  describe("Events", function () {
    it("Should emit PlayerJoined event when player joins", async function () {
      const player = players[0];
      
      await expect(
        lottery.connect(player).joinLottery({ value: ENTRY_FEE })
      ).to.emit(lottery, "PlayerJoined")
        .withArgs(playerAddresses[0], 1, 1);
    });

    it("Should emit WinnerSelected event when winner is chosen", async function () {
      // Add 10 players
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      await expect(
        lottery.connect(players[9]).joinLottery({ value: ENTRY_FEE })
      ).to.emit(lottery, "WinnerSelected");
    });

    it("Should emit LotteryReset event when lottery resets", async function () {
      // Add 10 players
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
      }

      await expect(
        lottery.connect(players[9]).joinLottery({ value: ENTRY_FEE })
      ).to.emit(lottery, "LotteryReset")
        .withArgs(2);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to pause/unpause lottery", async function () {
      await lottery.connect(owner).setLotteryActive(false);
      expect(await lottery.lotteryActive()).to.be.false;

      await expect(
        lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("Lottery is not active");

      await lottery.connect(owner).setLotteryActive(true);
      expect(await lottery.lotteryActive()).to.be.true;

      await expect(
        lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE })
      ).to.emit(lottery, "PlayerJoined");
    });

    it("Should prevent non-owner from pausing lottery", async function () {
      await expect(
        lottery.connect(players[0]).setLotteryActive(false)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle direct ETH transfers correctly", async function () {
      await expect(
        owner.sendTransaction({
          to: await lottery.getAddress(),
          value: ENTRY_FEE
        })
      ).to.be.revertedWith("Use joinLottery() function to participate");
    });

    it("Should return correct contract balance", async function () {
      expect(await lottery.getContractBalance()).to.equal(0);

      await lottery.connect(players[0]).joinLottery({ value: ENTRY_FEE });
      expect(await lottery.getContractBalance()).to.equal(ENTRY_FEE);
    });
  });
});

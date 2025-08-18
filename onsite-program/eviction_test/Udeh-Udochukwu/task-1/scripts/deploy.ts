import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Lottery", function () {
  async function deployLotteryFixture() {
    const [
      owner,
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
      player11,
    ] = await hre.ethers.getSigners();

    const Lottery = await hre.ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();

    return {
      lottery,
      owner,
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
      player11,
    };
  }

  it("Users can enter only with the exact fee", async function () {
    const { lottery, player1 } = await loadFixture(deployLotteryFixture);

    const entryFee = await lottery.ENTRY_FEE();

    // Should succeed with exact fee
    await expect(lottery.connect(player1).enterLottery({ value: entryFee })).to
      .not.be.reverted;

    // Should fail with insufficient fee
    await expect(
      lottery.connect(player1).enterLottery({ value: entryFee - 1n })
    ).to.be.revertedWith("Invalid entry fee");

    // Should fail with excess fee
    await expect(
      lottery.connect(player1).enterLottery({ value: entryFee + 1n })
    ).to.be.revertedWith("Invalid entry fee");
  });

  it("The contract correctly tracks 10 players", async function () {
    const {
      lottery,
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
    } = await loadFixture(deployLotteryFixture);

    const entryFee = await lottery.ENTRY_FEE();
    const players = [
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
    ];

    for (let i = 0; i < 9; i++) {
      await lottery.connect(players[i]).enterLottery({ value: entryFee });
      const currentPlayers = await lottery.getPlayers();
      expect(currentPlayers.length).to.equal(i + 1);
    }

    expect((await lottery.getPlayers()).length).to.equal(9);
  });

  it("After 10 players, a winner is chosen", async function () {
    const {
      lottery,
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
    } = await loadFixture(deployLotteryFixture);

    const entryFee = await lottery.ENTRY_FEE();
    const players = [
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
    ];

    for (let i = 0; i < 9; i++) {
      await lottery.connect(players[i]).enterLottery({ value: entryFee });
    }

    await expect(
      lottery.connect(player10).enterLottery({ value: entryFee })
    ).to.emit(lottery, "WinnerChosen");
  });

 
  it("The lottery resets for the next round", async function () {
    const {
      lottery,
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
      player11,
    } = await loadFixture(deployLotteryFixture);

    const entryFee = await lottery.ENTRY_FEE();
    const players = [
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
    ];

    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).enterLottery({ value: entryFee });
    }

    expect(await lottery.currentRound()).to.equal(1);
    expect((await lottery.getPlayers()).length).to.equal(0);

    await lottery.connect(player11).enterLottery({ value: entryFee });
    expect((await lottery.getPlayers()).length).to.equal(1);
  });
});

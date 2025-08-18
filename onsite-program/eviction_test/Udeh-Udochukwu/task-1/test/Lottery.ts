const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery", function () {
  async function deployLotteryFixture() {
    const [owner, ...accounts] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    return { lottery, owner, accounts };
  }

  it("should only allow entry with exact fee", async function () {
    const { lottery, accounts } = await loadFixture(deployLotteryFixture);
    await expect(
      lottery
        .connect(accounts[0])
        .enterLottery({ value: ethers.parseEther("0.009") })
    ).to.be.revertedWith("Invalid entry fee");
    await expect(
      lottery
        .connect(accounts[0])
        .enterLottery({ value: ethers.parseEther("0.01") })
    ).to.emit(lottery, "newPlayer");
  });

  it("should track 10 players", async function () {
    const { lottery, accounts } = await loadFixture(deployLotteryFixture);
    for (let i = 0; i < 10; i++) {
      await lottery
        .connect(accounts[i])
        .enterLottery({ value: ethers.parseEther("0.01") });
    }
    const players = await lottery.getPlayers();
    expect(players.length).to.equal(10);
  });

  it("should choose a winner after 10 players", async function () {
    const { lottery, accounts } = await loadFixture(deployLotteryFixture);
    for (let i = 0; i < 9; i++) {
      await lottery
        .connect(accounts[i])
        .enterLottery({ value: ethers.parseEther("0.01") });
    }
    await expect(
      lottery
        .connect(accounts[9])
        .enterLottery({ value: ethers.parseEther("0.01") })
    ).to.emit(lottery, "WinnerChosen");
  });

  // it("should transfer prize pool to winner", async function () {
  //   const { lottery, accounts } = await loadFixture(deployLotteryFixture);
  //   for (let i = 0; i < 9; i++) {
  //     await lottery
  //       .connect(accounts[i])
  //       .enterLottery({ value: ethers.parseEther("0.01") });
  //   }
  //   const winnerPromise = new Promise(async (resolve) => {
  //     lottery.on("WinnerChosen", async (winner) => {
  //       resolve(winner);
  //     });
  //     await lottery
  //       .connect(accounts[9])
  //       .enterLottery({ value: ethers.parseEther("0.01") });
  //   });
  //   const winner = await winnerPromise;
  //   const winnerBalance = await ethers.provider.getBalance(winner);
  //   // Winner should have received close to 0.1 ether (minus gas)
  //   expect(winnerBalance).to.be.above(ethers.parseEther("10000.09")); // default test balance is 10000
  // });

  it("should reset for the next round", async function () {
    const { lottery, accounts } = await loadFixture(deployLotteryFixture);
    for (let i = 0; i < 10; i++) {
      await lottery
        .connect(accounts[i])
        .enterLottery({ value: ethers.parseEther("0.01") });
    }
    expect(await lottery.getPlayers()).to.deep.equal([]);
    expect(await lottery.currentRound()).to.equal(1);
    // Should allow previous players to enter again
    await lottery
      .connect(accounts[0])
      .enterLottery({ value: ethers.parseEther("0.01") });
    expect((await lottery.getPlayers()).length).to.equal(1);
  });
});

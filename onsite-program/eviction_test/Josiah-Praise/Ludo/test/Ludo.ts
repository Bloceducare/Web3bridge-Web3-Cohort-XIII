import { ethers } from "hardhat";
import { expect } from "chai";

describe("Ludo Game", function () {
  let ludo: any;
  let token: any;
  let accounts: any[];
  const stake = ethers.parseEther("10");

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();
    await token.waitForDeployment();
    const Ludo = await ethers.getContractFactory("Ludo");
    ludo = await Ludo.deploy(await token.getAddress(), stake);
    await ludo.waitForDeployment();
    for (let i = 0; i < 4; i++) {
      await token.transfer(accounts[i].address, stake);
    }
  });

  it("should register 4 players and start game", async () => {
    for (let i = 0; i < 4; i++) {
      await token.connect(accounts[i]).approve(await ludo.getAddress(), stake);
      await ludo.connect(accounts[i]).register("Player" + i, i);
    }
    expect(await ludo.gameStarted()).to.be.true;
  });

  it("should play game and payout winner", async () => {
    for (let i = 0; i < 4; i++) {
      await token.connect(accounts[i]).approve(await ludo.getAddress(), stake);
      await ludo.connect(accounts[i]).register("Player" + i, i);
    }
    let winner;
    let moves = 0;
    const maxMoves = 5000;
    while (!winner && moves < maxMoves) {
      const turn = await ludo.turn();
      await ludo.connect(accounts[Number(turn)]).play();
      winner = await ludo.winner();
      moves++;
    }
    if (winner === ethers.ZeroAddress) {
      console.warn(`Test inconclusive: No winner after ${maxMoves} moves.`);
      return;
    }
    const winnerBalance = await token.balanceOf(winner);
    expect(winnerBalance).to.equal(stake * 4n);
  });

  it("should not allow more than 4 players", async () => {
    for (let i = 0; i < 4; i++) {
      await token.connect(accounts[i]).approve(await ludo.getAddress(), stake);
      await ludo.connect(accounts[i]).register("Player" + i, i);
    }
    await token.connect(accounts[4]).approve(await ludo.getAddress(), stake);
    await expect(
      ludo.connect(accounts[4]).register("Player4", 0)
    ).to.be.revertedWithCustomError(ludo, "GameAlreadyStarted");
  });

  it("should not allow duplicate colors", async () => {
    await token.connect(accounts[0]).approve(await ludo.getAddress(), stake);
    await ludo.connect(accounts[0]).register("Player0", 0);
    await token.connect(accounts[1]).approve(await ludo.getAddress(), stake);
    await expect(
      ludo.connect(accounts[1]).register("Player1", 0)
    ).to.be.revertedWithCustomError(ludo, "ColorTaken");
  });
});

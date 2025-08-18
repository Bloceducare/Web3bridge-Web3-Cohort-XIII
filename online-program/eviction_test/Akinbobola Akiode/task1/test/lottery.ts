import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lottery", function () {
  const ENTRY_FEE = ethers.parseEther("0.01");

  async function deploy() {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(ENTRY_FEE);
    await lottery.waitForDeployment();
    const [deployer, ...signers] = await ethers.getSigners();
    return { lottery, deployer, signers };
  }

  it("reverts unless exact fee is sent", async () => {
    const { lottery, signers } = await deploy();
    await expect(lottery.connect(signers[0]).enterLottery({ value: ENTRY_FEE - 1n })).to.be.revertedWithCustomError(lottery, "InvalidEntryFee");
    await expect(lottery.connect(signers[0]).enterLottery({ value: ENTRY_FEE + 1n })).to.be.revertedWithCustomError(lottery, "InvalidEntryFee");
  });

  it("tracks players and prevents double entry per round", async () => {
    const { lottery, signers } = await deploy();
    await lottery.connect(signers[0]).enterLottery({ value: ENTRY_FEE });
    const players = await lottery.getPlayers();
    expect(players.length).to.eq(1);
    expect(players[0]).to.eq(await signers[0].getAddress());
    await expect(lottery.connect(signers[0]).enterLottery({ value: ENTRY_FEE })).to.be.revertedWithCustomError(lottery, "AlreadyEnteredThisRound");
  });

  it("selects a winner only after 10 players and transfers prize pool, then resets", async () => {
    const { lottery, signers } = await deploy();
    const participants = signers.slice(0, 10);

    for (let i = 0; i < 9; i++) {
      await lottery.connect(participants[i]).enterLottery({ value: ENTRY_FEE });
    }

    const contractBalanceBefore = await ethers.provider.getBalance(await lottery.getAddress());
    expect(contractBalanceBefore).to.eq(ENTRY_FEE * 9n);

    await expect(lottery.connect(participants[9]).enterLottery({ value: ENTRY_FEE }))
      .to.emit(lottery, "WinnerSelected");

    const contractBalanceAfter = await ethers.provider.getBalance(await lottery.getAddress());
    expect(contractBalanceAfter).to.eq(0n);

    const playersAfter = await lottery.getPlayers();
    expect(playersAfter.length).to.eq(0);

    const round = await lottery.currentRound();
    expect(round).to.eq(2n);

    const nextTen = signers.slice(0, 10);
    for (let i = 0; i < 10; i++) {
      await lottery.connect(nextTen[i]).enterLottery({ value: ENTRY_FEE });
    }
    expect(await lottery.playersCount()).to.eq(0n);
    expect(await lottery.currentRound()).to.eq(3n);
  });
});



import { ethers } from "hardhat";
import { expect } from "chai";

describe("Lottery Contract", function () {
  let Lottery: any;
  let lottery: any;
  let entryFee = ethers.parseEther("0.01");
  let accounts: any[];

  beforeEach(async function () {
    Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy();
    await lottery.deployed();
    accounts = await ethers.getSigners();
  });

  it("should allow joining only with exact 0.01 ETH", async function () {
    await expect(
      lottery.connect(accounts[1]).joinLottery({ value: ethers.parseEther("0.005") })
    ).to.be.revertedWith("amount to join is 0.01 ETH");

    await expect(
      lottery.connect(accounts[1]).joinLottery({ value: entryFee })
    ).to.emit(lottery, "joinedLottery").withArgs(accounts[1].address, entryFee);
  });

  it("should not allow double entry in the same round", async function () {
    await lottery.connect(accounts[2]).joinLottery({ value: entryFee });
    await expect(
      lottery.connect(accounts[2]).joinLottery({ value: entryFee })
    ).to.be.revertedWith("You have already joined the lottery");
  });

  it("should track exactly 10 players", async function () {
    for (let i = 0; i < 10; i++) {
      await lottery.connect(accounts[i + 1]).joinLottery({ value: entryFee });
    }
    expect(await lottery.players.length).to.equal(0); // Should reset after winner, check internal
  });

  it("should only pick a winner after 10 players", async function () {
    for (let i = 0; i < 9; i++) {
      await lottery.connect(accounts[i + 1]).joinLottery({ value: entryFee });
    }
    // Winner is not picked yet! Should not emit winner event yet
    await expect(
      lottery.connect(accounts[10]).joinLottery({ value: entryFee })
    ).to.emit(lottery, "winner");
  });

  it("should transfer the pool to the winner and reset correctly", async function () {
    for (let i = 0; i < 10; i++) {
      await lottery.connect(accounts[i + 1]).joinLottery({ value: entryFee });
    }
    // After round, check contract balance is zero
    expect(await ethers.provider.getBalance(lottery.address)).to.equal(0);
    // Next round should allow previous accounts to join again
    await lottery.connect(accounts[1]).joinLottery({ value: entryFee });
    expect(await lottery.participant(accounts[1].address)).to.equal(true);
  });
});

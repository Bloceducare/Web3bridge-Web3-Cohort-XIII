import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lottery", function () {
  let lottery: any;
  let accounts: any[];

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy();
  });

  it("should allow entry only with exact fee", async () => {
    await expect(
      lottery.connect(accounts[1]).enter({ value: ethers.parseEther("0.009") })
    ).to.be.revertedWithCustomError(lottery, "InvalidEntryFee");
    await expect(
      lottery.connect(accounts[1]).enter({ value: ethers.parseEther("0.01") })
    ).to.emit(lottery, "PlayerJoined");
  });

  it("should not allow double entry in same round", async () => {
    await lottery
      .connect(accounts[1])
      .enter({ value: ethers.parseEther("0.01") });
    await expect(
      lottery.connect(accounts[1]).enter({ value: ethers.parseEther("0.01") })
    ).to.be.revertedWithCustomError(lottery, "AlreadyEntered");
  });

  it("should track 10 players and pick winner", async () => {
    for (let i = 1; i <= 10; i++) {
      await lottery
        .connect(accounts[i])
        .enter({ value: ethers.parseEther("0.01") });
    }
    expect(await lottery.getPlayers()).to.be.empty;
    expect(await lottery.round()).to.equal(1);
    expect(await lottery.winner()).to.not.equal(ethers.ZeroAddress);
  });

  it("should transfer prize to winner", async () => {
    for (let i = 1; i <= 10; i++) {
      await lottery
        .connect(accounts[i])
        .enter({ value: ethers.parseEther("0.01") });
    }
    const winner = await lottery.winner();
    const winnerBalance = await ethers.provider.getBalance(winner);
    expect(winnerBalance).to.be.gt(ethers.parseEther("10000"));
  });

  it("should reset for next round", async () => {
    for (let i = 1; i <= 10; i++) {
      await lottery
        .connect(accounts[i])
        .enter({ value: ethers.parseEther("0.01") });
    }
    for (let i = 1; i <= 10; i++) {
      await lottery
        .connect(accounts[i])
        .enter({ value: ethers.parseEther("0.01") });
    }
    expect(await lottery.round()).to.equal(2);
    expect(await lottery.getPlayers()).to.be.empty;
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery Contract", function () {
  it("should deploy with correct entry fee", async function () {
    const [owner] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const entryFee = ethers.parseEther("0.1");
    const lottery = await Lottery.deploy(entryFee);

    expect(await lottery.entryFee()).to.equal(entryFee);
    expect(await lottery.currentRound()).to.equal(1);
  });

  it("should revert if incorrect fee is sent", async function () {
    const [owner, player1] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const entryFee = ethers.parseEther("1");
    const lottery = await Lottery.deploy(entryFee);

    await expect(
      lottery.connect(player1).join({ value: ethers.parseEther("0.5") })
    ).to.be.revertedWithCustomError(lottery, "IncorrectFee");
  });

  it("should allow a player to join and emit event", async function () {
    const [owner, player1] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const entryFee = ethers.parseEther("0.2");
    const lottery = await Lottery.deploy(entryFee);

    await expect(lottery.connect(player1).join({ value: entryFee }))
      .to.emit(lottery, "PlayerJoined")
      .withArgs(1, player1.address, 1);

    expect(await lottery.hasJoined(player1.address)).to.equal(true);
    expect(await lottery.playersCount()).to.equal(1);
  });

  it("should revert if a player tries to join twice", async function () {
    const [owner, player1] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const entryFee = ethers.parseEther("0.3");
    const lottery = await Lottery.deploy(entryFee);

    await lottery.connect(player1).join({ value: entryFee });
    await expect(
      lottery.connect(player1).join({ value: entryFee })
    ).to.be.revertedWithCustomError(lottery, "AlreadyJoined");
  });

  it("should select a winner when 10 players join", async function () {
    const [owner, ...players] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const entryFee = ethers.parseEther("0.5");
    const lottery = await Lottery.deploy(entryFee);

    const joinTxs = [];
    for (let i = 0; i < 10; i++) {
      joinTxs.push(
        lottery.connect(players[i]).join({ value: entryFee })
      );
    }

    await Promise.all(joinTxs);

    const round = await lottery.currentRound();
    expect(round).to.equal(2); // should increment after winner selected

    expect(await lottery.playersCount()).to.equal(0);
  });
});

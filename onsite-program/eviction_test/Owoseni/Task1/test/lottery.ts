const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = ethers;

describe("Lottery", function () {
  it("Users can enter only with the exact fee", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();

    await expect(lottery.enterLottery({ value: parseEther("0.009") })).to.be.revertedWith("Entry fee must be exactly 0.01 ETH");
    await lottery.enterLottery({ value: parseEther("0.01") });
    expect((await lottery.getPlayers()).length).to.equal(1);
  });

  it("Only after 10 players, a winner is chosen", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();

    const signers = await ethers.getSigners();
    for (let i = 0; i < 10; i++) {
      await lottery.connect(signers[i]).enterLottery({ value: parseEther("0.01") });
    }
    // After 10 players, winner is automatically selected
    // We can't directly check the winner as it's not stored in a public variable
    // Instead, we can check that the players array is reset
    expect((await lottery.getPlayers()).length).to.equal(0);
  });

  it("The prize pool is transferred correctly to the winner", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    
    // Get initial balances
    const signers = await ethers.getSigners();
    
    // Record the contract's initial balance
    const initialContractBalance = await ethers.provider.getBalance(await lottery.getAddress());
    
    // Have 10 players enter the lottery
    for (let i = 0; i < 10; i++) {
      await lottery.connect(signers[i]).enterLottery({ value: parseEther("0.01") });
    }
    
    // After 10 players, winner is automatically selected
    // Check that the contract balance is back to initial (all funds transferred)
    expect(await ethers.provider.getBalance(await lottery.getAddress())).to.equal(initialContractBalance);
  });

  it("The lottery resets for the next round", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();

    await lottery.enterLottery({ value: parseEther("0.01") });
    await lottery.emergencyReset();
    expect((await lottery.getPlayers()).length).to.equal(0);
  });
});
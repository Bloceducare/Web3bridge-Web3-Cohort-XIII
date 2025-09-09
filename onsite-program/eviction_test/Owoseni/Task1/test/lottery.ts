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
  
    expect((await lottery.getPlayers()).length).to.equal(0);
  });

  it("The prize pool is transferred correctly to the winner", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    
    const signers = await ethers.getSigners();
    
    const initialContractBalance = await ethers.provider.getBalance(await lottery.getAddress());
    
    for (let i = 0; i < 10; i++) {
      await lottery.connect(signers[i]).enterLottery({ value: parseEther("0.01") });
    }
    
   
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
import { expect } from "chai";
import { ethers } from "hardhat";

describe("LotteryContract", () => {
  it("deploys and starts active", async () => {
    const factory = await ethers.getContractFactory("LotteryContract");
    const lottery = await factory.deploy();
    expect(await lottery.isActive()).to.be.true;
  });

  it("lets a new player enter", async () => {
    const [owner, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("LotteryContract");
    const lottery = await factory.deploy();
    await lottery.connect(alice).enter({ value: ethers.parseEther("0.0001") });
    expect((await lottery.getPlayers())[0]).to.eq(alice.address);
  });

  it("rejects wrong fee", async () => {
    const [owner, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("LotteryContract");
    const lottery = await factory.deploy();
    await expect(
      lottery.connect(bob).enter({ value: ethers.parseEther("0.0002") })
    ).to.be.revertedWith("Incorrect entry fee");
  });

  it("rejects duplicate entry", async () => {
    const [owner, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("LotteryContract");
    const lottery = await factory.deploy();
    await lottery.connect(alice).enter({ value: ethers.parseEther("0.0001") });
    await expect(
      lottery.connect(alice).enter({ value: ethers.parseEther("0.0001") })
    ).to.be.revertedWith("Already entered this round");
  });

  it("rejects entry when full", async () => {
    const signers = await ethers.getSigners();
    const factory = await ethers.getContractFactory("LotteryContract");
    const lottery = await factory.deploy();
    for (let i = 1; i <= 10; i++) {
      await lottery.connect(signers[i]).enter({ value: ethers.parseEther("0.0001") });
    }
    await expect(
      lottery.connect(signers[11]).enter({ value: ethers.parseEther("0.0001") })
    ).to.be.revertedWith("Lottery is full");
  });
  
  it("picks winner and resets at 10 players", async () => {
    const signers = await ethers.getSigners();
    const factory = await ethers.getContractFactory("LotteryContract");
    const lottery = await factory.deploy();

    for (let i = 1; i <= 10; i++) {
      await lottery.connect(signers[i]).enter({ value: ethers.utils.parseEther("0.0001") });
    }

    expect(await lottery.getPlayers()).to.have.length(0);
    expect(await lottery.isActive()).to.be.true;
  });
});
// test/LootBox.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { LootBox } from "../typechain-types";

describe("LootBox", function () {
  const BOX_PRICE = ethers.parseEther("0.01");
  
  async function deployLootBox() {
    const [owner, user] = await ethers.getSigners();
    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy("1", BOX_PRICE);
    return { lootBox, owner, user };
  }

  it("Should deploy with correct settings", async function () {
    const { lootBox } = await deployLootBox();
    
    expect(await lootBox.boxPrice()).to.equal(BOX_PRICE);
    expect(await lootBox.getRewardsCount()).to.equal(1);
    
    const reward = await lootBox.getReward(0);
    expect(reward.name).to.equal("Better Luck Next Time!");
  });

  it("Should handle payments correctly", async function () {
    const { lootBox, user } = await deployLootBox();
    
    await expect(
      lootBox.connect(user).openBox({ value: ethers.parseEther("0.005") })
    ).to.be.revertedWith("Not enough ETH");

  });

  it("Should manage rewards and probabilities", async function () {
    const { lootBox } = await deployLootBox();
    
    await lootBox.addReward(0, ethers.ZeroAddress, 0, 100, 30, "Test");
    
    expect(await lootBox.getRewardsCount()).to.equal(2);
    expect(await lootBox.getRewardProbability(0)).to.equal(6250); 
    expect(await lootBox.getRewardProbability(1)).to.equal(3750); 
  });

  it("Should allow owner withdrawal", async function () {
    const { lootBox } = await deployLootBox();

    await expect(lootBox.withdraw()).to.be.revertedWith("No funds");
  });
});
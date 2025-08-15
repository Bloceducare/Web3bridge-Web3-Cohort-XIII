import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("LootBox", function (){
  async function deployLootBoxFixture() {
    const [owner, user] = await ethers.getSigners();

    const RNG = await ethers.getContractFactory("MockRNG");
    const rng = await RNG.deploy();

    const ERC20 = await ethers.getContractFactory("MockERC20");
    const erc20 = await ERC20.deploy();
    await erc20.mint(owner.address, 1000);

    const ERC721 = await ethers.getContractFactory("MockERC721");
    const erc721 = await ERC721.deploy();
    await erc721.mint(owner.address, 1);

    const ERC1155 = await ethers.getContractFactory("MockERC1155");
    const erc1155 = await ERC1155.deploy();
    await erc1155.mint(owner.address, 42, 10);

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(rng.target, ethers.parseEther("0.01"));

    await erc20.transfer(lootBox.target, 100);
    await erc721.transferFrom(owner.address, lootBox.target, 1);
    // await erc1155.safeTransferFrom(owner.address, lootBox.target, 42, 5, "0x");

    await lootBox.addReward(0, erc20.target, 10, 1);
    await lootBox.addReward(1, erc721.target, 1, 2);
    await lootBox.addReward(2, erc1155.target, 42, 3);
    return {lootBox, rng, erc20, erc721, erc1155, owner, user};
  }

  it("should only allow owner to add rewards", async () => {
    const {lootBox, rng, erc20, owner, user} = await loadFixture(deployLootBoxFixture);
    await expect(
      lootBox.connect(user).addReward(0, erc20.target, 10, 1)
    ).to.be.revertedWith("Not owner");
  });

  it("should not allow zero weight reward", async () => {
    const {lootBox, rng, erc20,owner, user} = await loadFixture(deployLootBoxFixture);

    await expect(
      lootBox.addReward(0, erc20.target, 10, 0)
    ).to.be.revertedWith("weight=0");
  });

  it("should add rewards and update totalWeight", async () => {
    const {lootBox, rng, erc20,owner, user} = await loadFixture(deployLootBoxFixture);
    expect(await lootBox.totalWeight()).to.equal(6);
    const reward = await lootBox.rewards(0);
    expect(reward.token).to.equal(erc20.target);
  });

  it("should not open box with wrong fee", async () => {
    const {lootBox, rng, erc20,owner, user} = await loadFixture(deployLootBoxFixture);

    await expect(
      lootBox.connect(user).openBox({ value: ethers.parseEther("0.02") })
    ).to.be.revertedWith("fee error");
  });

  it("should open box and emit event", async () => {
    const {lootBox, rng, erc20,owner, user} = await loadFixture(deployLootBoxFixture);
    await expect(
      lootBox.connect(user).openBox({ value: ethers.parseEther("0.01") })
    ).to.emit(lootBox, "BoxOpened");
  });

  it("should only allow RNG to call onRandomnessReady", async () => {
    const {lootBox, rng, erc20,owner, user} = await loadFixture(deployLootBoxFixture);
    await expect(
      lootBox.onRandomnessReady(1, 123, user.address)
    ).to.be.revertedWith("not rng");
  });

  it("should distribute ERC20 reward", async () => {
    const {lootBox, rng, erc20,owner, user} = await loadFixture(deployLootBoxFixture);

    await rng.mockCallback(lootBox.target, 0, user.address);
    expect(await erc20.balanceOf(user.address)).to.equal(10);
  });

  it("should distribute ERC721 reward", async () => {
    const {lootBox, rng, erc20,owner, erc721, user} = await loadFixture(deployLootBoxFixture);

    await rng.mockCallback(lootBox.target, 1, user.address);
    expect(await erc721.ownerOf(1)).to.equal(user.address);
  });

  it("should distribute ERC1155 reward", async () => {
    const {lootBox, rng, erc20,owner, erc721,erc1155, user} = await loadFixture(deployLootBoxFixture);

    await rng.mockCallback(lootBox.target, 3, user.address);
    expect(await erc1155.balanceOf(user.address, 42)).to.equal(1);
  });

  it("should only allow owner to withdraw", async () => {
    const {lootBox, rng, erc20,owner, user} = await loadFixture(deployLootBoxFixture);
    await expect(
      lootBox.connect(user).withdraw()
    ).to.be.revertedWith("Not owner");
  });

  it("should withdraw contract balance to owner", async () => {
    const {lootBox, rng, erc20,owner, user} = await loadFixture(deployLootBoxFixture);
    await lootBox.connect(user).openBox({ value: ethers.parseEther("0.01") });
    const before = await ethers.provider.getBalance(owner.address);
    const tx = await lootBox.withdraw();
    const receipt = await tx.wait();
    const after = await ethers.provider.getBalance(owner.address);
    expect(after).to.be.gt(before);
  });
});
import { ethers } from "hardhat";
import { expect } from "chai";

describe("LootBox", function () {
  let lootBox: any;
  let rng: any;
  let owner: any;
  let user: any;
  let erc20: any;
  let erc721: any;
  let erc1155: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mocks
    const RNG = await ethers.getContractFactory("MockRNG");
    rng = await RNG.deploy();

    const ERC20 = await ethers.getContractFactory("MockERC20");
    erc20 = await ERC20.deploy();
    await erc20.mint(owner.address, 1000);

    const ERC721 = await ethers.getContractFactory("MockERC721");
    erc721 = await ERC721.deploy();
    await erc721.mint(owner.address, 1);

    const ERC1155 = await ethers.getContractFactory("MockERC1155");
    erc1155 = await ERC1155.deploy();
    await erc1155.mint(owner.address, 42, 10);

    // Deploy LootBox
    const LootBox = await ethers.getContractFactory("LootBox");
    lootBox = await LootBox.deploy(rng.address, ethers.parseEther("0.01"));

    // Transfer tokens to LootBox for rewards
    await erc20.transfer(lootBox.address, 100);
    await erc721.transferFrom(owner.address, lootBox.address, 1);
    await erc1155.safeTransferFrom(owner.address, lootBox.address, 42, 5, "0x");

    // Add rewards
    await lootBox.addReward(0, erc20.address, 10, 1); // ERC20
    await lootBox.addReward(1, erc721.address, 1, 2); // ERC721
    await lootBox.addReward(2, erc1155.address, 42, 3); // ERC1155
  });

  it("should only allow owner to add rewards", async () => {
    await expect(
      lootBox.connect(user).addReward(0, erc20.address, 10, 1)
    ).to.be.revertedWith("Not owner");
  });

  it("should not allow zero weight reward", async () => {
    await expect(
      lootBox.addReward(0, erc20.address, 10, 0)
    ).to.be.revertedWith("weight=0");
  });

  it("should add rewards and update totalWeight", async () => {
    expect(await lootBox.totalWeight()).to.equal(6);
    const reward = await lootBox.rewards(0);
    expect(reward.token).to.equal(erc20.address);
  });

  it("should not open box with wrong fee", async () => {
    await expect(
      lootBox.connect(user).openBox({ value: ethers.parseEther("0.02") })
    ).to.be.revertedWith("fee error");
  });

  it("should open box and emit event", async () => {
    await expect(
      lootBox.connect(user).openBox({ value: ethers.parseEther("0.01") })
    ).to.emit(lootBox, "BoxOpened");
  });

  it("should only allow RNG to call onRandomnessReady", async () => {
    await expect(
      lootBox.onRandomnessReady(1, 123, user.address)
    ).to.be.revertedWith("not rng");
  });

  it("should distribute ERC20 reward", async () => {
    await rng.mockCallback(lootBox.address, 0, user.address);
    expect(await erc20.balanceOf(user.address)).to.equal(10);
  });

  it("should distribute ERC721 reward", async () => {
    await rng.mockCallback(lootBox.address, 1, user.address);
    expect(await erc721.ownerOf(1)).to.equal(user.address);
  });

  it("should distribute ERC1155 reward", async () => {
    await rng.mockCallback(lootBox.address, 3, user.address);
    expect(await erc1155.balanceOf(user.address, 42)).to.equal(1);
  });

  it("should only allow owner to withdraw", async () => {
    await expect(
      lootBox.connect(user).withdraw()
    ).to.be.revertedWith("Not owner");
  });

  it("should withdraw contract balance to owner", async () => {
    await lootBox.connect(user).openBox({ value: ethers.parseEther("0.01") });
    const before = await ethers.provider.getBalance(owner.address);
    const tx = await lootBox.withdraw();
    const receipt = await tx.wait();
    const after = await ethers.provider.getBalance(owner.address);
    expect(after).to.be.gt(before);
  });
});
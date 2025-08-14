const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LootBox", function () {

  it("deploys LootBox and mock tokens", async function () {
    const [owner, , treasury] = await ethers.getSigners();
    const boxFee = ethers.utils.parseEther("0.1");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      ethers.constants.AddressZero,
      1,
      ethers.constants.HashZero,
      boxFee,
      treasury.address
    );
    await lootBox.deployed();

    expect(await lootBox.owner()).to.equal(owner.address);
    expect(await lootBox.boxFee()).to.equal(boxFee);
  });

  it("adds rewards to LootBox", async function () {
    const [owner, , treasury] = await ethers.getSigners();
    const boxFee = ethers.utils.parseEther("0.1");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      ethers.constants.AddressZero,
      1,
      ethers.constants.HashZero,
      boxFee,
      treasury.address
    );
    await lootBox.deployed();

    await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("10"), 50);
    const count = await lootBox.rewardCount();
    expect(count).to.equal(1);
  });

  it("opens LootBox and requests VRF", async function () {
    const [owner, user, treasury] = await ethers.getSigners();
    const boxFee = ethers.utils.parseEther("0.1");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      ethers.constants.AddressZero,
      1,
      ethers.constants.HashZero,
      boxFee,
      treasury.address
    );
    await lootBox.deployed();

    await mockERC20.mint(lootBox.address, ethers.utils.parseEther("100"));
    await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("10"), 50);

    const tx = await lootBox.connect(user).openBox({ value: boxFee });
    const receipt = await tx.wait();
    const requestId = receipt.events.find(e => e.event === "VRFRequested").args[0];

    expect(requestId).to.not.be.undefined;
  });

  it("fulfills VRF and dispenses reward", async function () {
    const [owner, user, treasury] = await ethers.getSigners();
    const boxFee = ethers.utils.parseEther("0.1");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      ethers.constants.AddressZero,
      1,
      ethers.constants.HashZero,
      boxFee,
      treasury.address
    );
    await lootBox.deployed();

    await mockERC20.mint(lootBox.address, ethers.utils.parseEther("100"));
    await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("10"), 50);

    const tx = await lootBox.connect(user).openBox({ value: boxFee });
    const receipt = await tx.wait();
    const requestId = receipt.events.find(e => e.event === "VRFRequested").args[0];

    await lootBox.fulfillRandomWords(requestId, [12345]);

    const balance = await mockERC20.balanceOf(user.address);
    expect(balance).to.equal(ethers.utils.parseEther("10"));
  });

});

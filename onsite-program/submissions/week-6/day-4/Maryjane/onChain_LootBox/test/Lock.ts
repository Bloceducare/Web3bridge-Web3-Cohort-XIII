// test/LootBox.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("LootBox", function () {
  it("deploys LootBox and mock tokens", async function () {
    const [owner, , treasury] = await ethers.getSigners();
    const boxFee = ethers.parseEther("0.1");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.waitForDeployment();

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      ethers.ZeroAddress,
      1,
      ethers.ZeroHash,
      boxFee,
      treasury.address
    );
    await lootBox.waitForDeployment();

    expect(await lootBox.owner()).to.equal(owner.address);
    expect(await lootBox.boxFee()).to.equal(boxFee);
  });

  it("adds rewards to LootBox", async function () {
    const [owner, , treasury] = await ethers.getSigners();
    const boxFee = ethers.parseEther("0.1");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.waitForDeployment();

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      ethers.ZeroAddress,
      1,
      ethers.ZeroHash,
      boxFee,
      treasury.address
    );
    await lootBox.waitForDeployment();

    await lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50);
    const count = await lootBox.rewardCount();
    expect(count).to.equal(1n);
  });

  it("opens LootBox and requests VRF", async function () {
    const [owner, user, treasury] = await ethers.getSigners();
    const boxFee = ethers.parseEther("0.1");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.waitForDeployment();

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      ethers.ZeroAddress,
      1,
      ethers.ZeroHash,
      boxFee,
      treasury.address
    );
    await lootBox.waitForDeployment();

    await mockERC20.mint(await lootBox.getAddress(), ethers.parseEther("100"));
    await lootBox.addReward(0, await mockERC20.getAddress(), 0, ethers.parseEther("10"), 50);

    const tx = await lootBox.connect(user).openBox({ value: boxFee });
    const receipt = await tx.wait();

    // Parse logs to find `VRFRequested(requestId)`
    const eventLog = receipt?.logs.find(log =>
      Array.isArray(log.topics) && log.topics.includes(ethers.id("VRFRequested(uint256)"))
    );

    expect(eventLog).to.not.be.undefined;
  });

  it("fulfills VRF and dispenses reward", async function () {
    const [owner, user, treasury] = await ethers.getSigners();
    const boxFee = ethers.parseEther("0.1");

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.waitForDeployment();

    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      ethers.ZeroAddress,
      1,
      ethers.ZeroHash,
      boxFee,
      treasury.address
    );
    await lootBox.waitForDeployment();

    const lootBoxAddress = await lootBox.getAddress();
    const mockERC20Address = await mockERC20.getAddress();

    await mockERC20.mint(lootBoxAddress, ethers.parseEther("100"));
    await lootBox.addReward(0, mockERC20Address, 0, ethers.parseEther("10"), 50);

    const tx = await lootBox.connect(user).openBox({ value: boxFee });
    const receipt = await tx.wait();

    const eventLog = receipt?.logs.find(log =>
      Array.isArray(log.topics) && log.topics.includes(ethers.id("VRFRequested(uint256)"))
    );

    const iface = new ethers.Interface(["event VRFRequested(uint256 indexed requestId)"]);
    const parsedLog = iface.parseLog(eventLog as any);
    const requestId = parsedLog.args[0];

    await lootBox.fulfillRandomWords(requestId, [12345n]);

    const balance = await mockERC20.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("10"));
  });
});
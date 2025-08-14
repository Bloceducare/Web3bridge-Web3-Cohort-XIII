const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LootBox", function () {
  it("should deploy with correct initial state", async function () {
    const [owner] = await ethers.getSigners();
    const boxFee = ethers.parseEther("0.1");
    const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

    // Deploy VRF Mock
    const VRFMockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfMock = await VRFMockFactory.deploy(
      ethers.parseEther("0.000000001"), 
      ethers.parseEther("0.000000001")
    );
    await vrfMock.waitForDeployment();

    // Create subscription & fund
    const subTx = await vrfMock.createSubscription();
    const subReceipt = await subTx.wait();
    const subId = subReceipt.logs[0].args[0];
    await vrfMock.fundSubscription(subId, ethers.parseEther("10"));

    // Deploy LootBox
    const LootBoxFactory = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBoxFactory.deploy(boxFee, await vrfMock.getAddress(), keyHash, subId);
    await lootBox.waitForDeployment();

    expect(await lootBox.boxFee()).to.equal(boxFee);
  });

  it("should allow a user to buy a loot box with correct fee", async function () {
    const [owner, user] = await ethers.getSigners();
    const boxFee = ethers.parseEther("0.1");
    const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

    // Deploy VRF Mock
    const VRFMockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfMock = await VRFMockFactory.deploy(
      ethers.parseEther("0.000000001"), 
      ethers.parseEther("0.000000001")
    );
    await vrfMock.waitForDeployment();

    // Create subscription & fund
    const subTx = await vrfMock.createSubscription();
    const subReceipt = await subTx.wait();
    const subId = subReceipt.logs[0].args[0];
    await vrfMock.fundSubscription(subId, ethers.parseEther("10"));

    // Deploy LootBox
    const LootBoxFactory = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBoxFactory.deploy(boxFee, await vrfMock.getAddress(), keyHash, subId);
    await lootBox.waitForDeployment();
    await vrfMock.addConsumer(subId, await lootBox.getAddress());

    await expect(
      lootBox.connect(user).buyBox({ value: boxFee })
    ).to.emit(lootBox, "BoxPurchased").withArgs(user.address);
  });

  it("should reject purchase if incorrect fee is sent", async function () {
    const [owner, user] = await ethers.getSigners();
    const boxFee = ethers.parseEther("0.1");
    const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

    // Deploy VRF Mock
    const VRFMockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfMock = await VRFMockFactory.deploy(
      ethers.parseEther("0.000000001"), 
      ethers.parseEther("0.000000001")
    );
    await vrfMock.waitForDeployment();

    // Create subscription & fund
    const subTx = await vrfMock.createSubscription();
    const subReceipt = await subTx.wait();
    const subId = subReceipt.logs[0].args[0];
    await vrfMock.fundSubscription(subId, ethers.parseEther("10"));

    // Deploy LootBox
    const LootBoxFactory = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBoxFactory.deploy(boxFee, await vrfMock.getAddress(), keyHash, subId);
    await lootBox.waitForDeployment();

    await expect(
      lootBox.connect(user).buyBox({ value: ethers.parseEther("0.05") })
    ).to.be.revertedWith("Incorrect fee");
  });
});

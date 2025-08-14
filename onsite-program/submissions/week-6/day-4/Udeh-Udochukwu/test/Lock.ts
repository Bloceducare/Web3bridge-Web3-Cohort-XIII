const { expect } = require("chai");
const { ethers, loadFixture } = require("hardhat");

describe("LootBox", function () {
  async function deployLootBoxFixture() {
    const [owner, user] = await ethers.getSigners();

    // Deploy mock token contracts
    const ERC20 = await ethers.getContractFactory("MockERC20");
    const erc20Token = await ERC20.deploy(
      "Mock Token",
      "MTK",
      ethers.utils.parseEther("1000")
    );
    await erc20Token.deployed();

    const ERC721 = await ethers.getContractFactory("MockERC721");
    const erc721Token = await ERC721.deploy("Mock NFT", "MNFT");
    await erc721Token.deployed();

    const ERC1155 = await ethers.getContractFactory("MockERC1155");
    const erc1155Token = await ERC1155.deploy();
    await erc1155Token.deployed();

    // Deploy mock VRF Coordinator
    const VRFCoordinatorV2Mock = await ethers.getContractFactory(
      "VRFCoordinatorV2Mock"
    );
    const vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(0, 0);
    await vrfCoordinatorMock.deployed();

    // Create VRF subscription
    const subscriptionTx = await vrfCoordinatorMock.createSubscription();
    const subscriptionReceipt = await subscriptionTx.wait();
    const subscriptionId = subscriptionReceipt.events[0].args.subId;

    // Fund subscription with LINK (mock)
    await vrfCoordinatorMock.fundSubscription(
      subscriptionId,
      ethers.utils.parseEther("10")
    );

    // Deploy LootBox
    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      subscriptionId,
      erc20Token.address,
      erc721Token.address,
      erc1155Token.address
    );
    await lootBox.deployed();

    // Fund LootBox with tokens
    await erc20Token.transfer(lootBox.address, ethers.utils.parseEther("100"));
    await erc721Token.mint(lootBox.address, 1); // Mint NFT with tokenId 1
    await erc1155Token.mint(lootBox.address, 1, 5, "0x"); // Mint 5 ERC1155 tokens with ID 1

    // Add LootBox as consumer to VRF subscription
    await vrfCoordinatorMock.addConsumer(subscriptionId, lootBox.address);

    return {
      lootBox,
      erc20Token,
      erc721Token,
      erc1155Token,
      vrfCoordinatorMock,
      owner,
      user,
    };
  }

  it("should allow a user to open a loot box and receive an ERC20 reward", async function () {
    const { lootBox, erc20Token, vrfCoordinatorMock, user } = await loadFixture(
      deployLootBoxFixture
    );

    // User opens a loot box
    const boxPrice = ethers.utils.parseEther("0.01");
    const tx = await lootBox.connect(user).openBox({ value: boxPrice });
    const receipt = await tx.wait();
    const requestId = receipt.events.find((e : any) => e.event === "BoxOpened").args
      .requestId;

    // Simulate VRF response (random number = 10, within ERC20 weight range [0, 50))
    await vrfCoordinatorMock.fulfillRandomWordsWithOverride(
      requestId,
      lootBox.address,
      [10]
    );

    // Check ERC20 balance
    const userBalance = await erc20Token.balanceOf(user.address);
    expect(userBalance).to.equal(ethers.utils.parseEther("100"));

    // Check RewardAssigned event
    const rewardEvent = (await lootBox.queryFilter("RewardAssigned"))[0];
    expect(rewardEvent.args.user).to.equal(user.address);
    expect(rewardEvent.args.rewardType).to.equal("ERC20");
    expect(rewardEvent.args.amount).to.equal(ethers.utils.parseEther("100"));
  });
});

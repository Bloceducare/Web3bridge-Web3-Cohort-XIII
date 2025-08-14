import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { GameToken, GameNFT, GameItem, LootBox, MockVRFCoordinatorV2 } from "../typechain-types";

async function deployLootBoxContracts() {
  const [owner, user1, user2] = await ethers.getSigners();

  // Deploy GameToken contract (ERC20)
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken: GameToken = (await GameToken.deploy()) as GameToken;
  await gameToken.waitForDeployment();

  // Deploy GameNFT contract (ERC721)
  const GameNFT = await ethers.getContractFactory("GameNFT");
  const gameNFT: GameNFT = (await GameNFT.deploy()) as GameNFT;
  await gameNFT.waitForDeployment();

  // Deploy GameItem contract (ERC1155)
  const GameItem = await ethers.getContractFactory("GameItem");
  const gameItem: GameItem = (await GameItem.deploy()) as GameItem;
  await gameItem.waitForDeployment();

  // Deploy MockVRFCoordinatorV2 contract
  const MockVRFCoordinatorV2 = await ethers.getContractFactory("MockVRFCoordinatorV2");
  const mockVRF: MockVRFCoordinatorV2 = (await MockVRFCoordinatorV2.deploy()) as MockVRFCoordinatorV2;
  await mockVRF.waitForDeployment();

  // Deploy LootBox contract
  const subscriptionId = 123; // Mock subscription ID for local testing
  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox: LootBox = (await LootBox.deploy(
    subscriptionId,
    await gameToken.getAddress(),
    await gameNFT.getAddress(),
    await gameItem.getAddress()
  )) as LootBox;
  await lootBox.waitForDeployment();

  // Transfer tokens and NFTs to LootBox for rewards
  await gameToken.transfer(lootBox.getAddress(), ethers.parseEther("10000")); // 10,000 tokens
  await gameNFT.setApprovalForAll(lootBox.getAddress(), true);
  await gameItem.setApprovalForAll(lootBox.getAddress(), true);
  for (let i = 0; i < 10; i++) {
    await gameNFT.transferFrom(owner.address, lootBox.getAddress(), i);
  }
  await gameItem.safeTransferFrom(
    owner.address,
    lootBox.getAddress(),
    1, // Token ID 1
    100, // 100 items
    "0x"
  );

  return { gameToken, gameNFT, gameItem, lootBox, mockVRF, owner, user1, user2 };
}

describe("LootBox Contract Tests", function () {
  describe("Deployment Tests", function () {
    it("Should deploy all contracts correctly", async function () {
      const { gameToken, gameNFT, gameItem, lootBox, mockVRF, owner } = await loadFixture(deployLootBoxContracts);
      expect(await gameToken.getAddress()).to.be.properAddress;
      expect(await gameNFT.getAddress()).to.be.properAddress;
      expect(await gameItem.getAddress()).to.be.properAddress;
      expect(await lootBox.getAddress()).to.be.properAddress;
      expect(await mockVRF.getAddress()).to.be.properAddress;
      expect(await lootBox.owner()).to.equal(owner.address);
    });
  });

  describe("Open Box Tests", function () {
    it("Should allow user to open a box with correct payment", async function () {
      const { lootBox, user1 } = await loadFixture(deployLootBoxContracts);
      await expect(
        lootBox.connect(user1).openBox({ value: ethers.parseEther("0.01") })
      )
        .to.emit(lootBox, "BoxOpened")
        .withArgs(user1.address, 1);
    });

    it("Should revert if payment is insufficient", async function () {
      const { lootBox, user1 } = await loadFixture(deployLootBoxContracts);
      await expect(
        lootBox.connect(user1).openBox({ value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Reward Assignment Tests", function () {
    async function openBoxWithUser1() {
      const { gameToken, gameNFT, gameItem, lootBox, mockVRF, owner, user1 } = await loadFixture(deployLootBoxContracts);
      await lootBox.connect(user1).openBox({ value: ethers.parseEther("0.01") });
      return { gameToken, gameNFT, gameItem, lootBox, mockVRF, owner, user1 };
    }

    it("Should assign ERC20 reward when random number is in ERC20 range", async function () {
      const { gameToken, lootBox, mockVRF, user1 } = await loadFixture(openBoxWithUser1);
      // Simulate VRF response (mock random number in ERC20 range: 0-49)
      await mockVRF.fulfillRandomWords(1, lootBox.getAddress());
      await expect(mockVRF.fulfillRandomWords(1, lootBox.getAddress()))
        .to.emit(lootBox, "RewardAssigned")
        .withArgs(user1.address, "ERC20", ethers.parseEther("100"));
      expect(await gameToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should assign ERC1155 reward when random number is in ERC1155 range", async function () {
      const { gameItem, lootBox, mockVRF, user1 } = await loadFixture(openBoxWithUser1);
      // Simulate VRF response (mock random number in ERC1155 range: 50-79)
      // Adjust random number generation in MockVRFCoordinatorV2 if needed for specific ranges
      await mockVRF.fulfillRandomWords(1, lootBox.getAddress());
      await expect(mockVRF.fulfillRandomWords(1, lootBox.getAddress()))
        .to.emit(lootBox, "RewardAssigned")
        .withArgs(user1.address, "ERC1155", 5);
      expect(await gameItem.balanceOf(user1.address, 1)).to.equal(5);
    });

    it("Should assign ERC721 reward when random number is in ERC721 range", async function () {
      const { gameNFT, lootBox, mockVRF, user1 } = await loadFixture(openBoxWithUser1);
      // Simulate VRF response (mock random number in ERC721 range: 80-99)
      await mockVRF.fulfillRandomWords(1, lootBox.getAddress());
      await expect(mockVRF.fulfillRandomWords(1, lootBox.getAddress()))
        .to.emit(lootBox, "RewardAssigned")
        .withArgs(user1.address, "ERC721", 1);
      expect(await gameNFT.ownerOf(0)).to.equal(user1.address);
    });
  });

  describe("Withdraw Funds Tests", function () {
    it("Should allow owner to withdraw funds", async function () {
      const { lootBox, owner, user1 } = await loadFixture(deployLootBoxContracts);
      await lootBox.connect(user1).openBox({ value: ethers.parseEther("0.01") });
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await expect(lootBox.connect(owner).withdraw())
        .to.emit(lootBox, "FundsWithdrawn")
        .withArgs(owner.address, ethers.parseEther("0.01"));
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      const { lootBox, user1 } = await loadFixture(deployLootBoxContracts);
      await lootBox.connect(user1).openBox({ value: ethers.parseEther("0.01") });
      await expect(lootBox.connect(user1).withdraw()).to.be.revertedWith("Not owner");
    });
  });
});
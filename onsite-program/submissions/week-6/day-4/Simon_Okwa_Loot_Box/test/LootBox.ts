import { expect } from "chai";
import { ethers } from "hardhat";
import { LootBox, MockVRFCoordinatorV2, MockERC20, MockERC721, MockERC1155 } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signature";
import { BigNumber } from "ethers";

describe("LootBox", function () {
  let lootBox: LootBox;
  let mockVRF: MockVRFCoordinatorV2;
  let mockERC20: MockERC20;
  let mockERC721: MockERC721;
  let mockERC1155: MockERC1155;
  
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  const SUBSCRIPTION_ID = 1;
  const GAS_LANE = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const CALLBACK_GAS_LIMIT = 500000;
  const BOX_PRICE = ethers.utils.parseEther("0.01");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy Mock VRF Coordinator
    const MockVRFCoordinatorFactory = await ethers.getContractFactory("MockVRFCoordinatorV2");
    mockVRF = await MockVRFCoordinatorFactory.deploy();
    await mockVRF.deployed();
    
    // Create subscription
    await mockVRF.createSubscription();
    
    // Deploy Mock Tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20Factory.deploy("Test Token", "TEST", ethers.utils.parseEther("1000000"));
    
    const MockERC721Factory = await ethers.getContractFactory("MockERC721");
    mockERC721 = await MockERC721Factory.deploy("Test NFT", "TNFT");
    
    const MockERC1155Factory = await ethers.getContractFactory("MockERC1155");
    mockERC1155 = await MockERC1155Factory.deploy("https://test.com/{id}.json");
    
    // Deploy LootBox
    const LootBoxFactory = await ethers.getContractFactory("LootBox");
    lootBox = await LootBoxFactory.deploy(
      SUBSCRIPTION_ID,
      mockVRF.address,
      GAS_LANE,
      CALLBACK_GAS_LIMIT
    );
    await lootBox.deployed();
    
    // Add LootBox as VRF consumer
    await mockVRF.addConsumer(SUBSCRIPTION_ID, lootBox.address);
    
    // Prepare tokens for rewards
    await mockERC20.transfer(lootBox.address, ethers.utils.parseEther("10000"));
    await mockERC721.mint(lootBox.address, 1);
    await mockERC721.mint(lootBox.address, 2);
    await mockERC1155.mint(lootBox.address, 1, 100, "0x");
    await mockERC1155.mint(lootBox.address, 2, 50, "0x");
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await lootBox.owner()).to.equal(owner.address);
    });
    
    it("Should set the correct box price", async function () {
      expect(await lootBox.boxPrice()).to.equal(BOX_PRICE);
    });
    
    it("Should have no rewards initially", async function () {
      expect(await lootBox.totalRewardTypes()).to.equal(0);
      expect(await lootBox.getTotalWeight()).to.equal(0);
    });
  });

  describe("Reward Management", function () {
    it("Should add ERC20 reward", async function () {
      const amount = ethers.utils.parseEther("100");
      const weight = 50;
      
      await expect(lootBox.addReward(0, mockERC20.address, 0, amount, weight))
        .to.emit(lootBox, "RewardAdded")
        .withArgs(0, 0, weight);
        
      expect(await lootBox.totalRewardTypes()).to.equal(1);
      expect(await lootBox.getTotalWeight()).to.equal(weight);
      
      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(0);
      expect(reward.tokenContract).to.equal(mockERC20.address);
      expect(reward.amount).to.equal(amount);
      expect(reward.weight).to.equal(weight);
      expect(reward.active).to.be.true;
    });
    
    it("Should add ERC721 reward", async function () {
      const tokenId = 1;
      const weight = 10;
      
      await lootBox.addReward(1, mockERC721.address, tokenId, 0, weight);
      
      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(1);
      expect(reward.tokenId).to.equal(tokenId);
    });
    
    it("Should add ERC1155 reward", async function () {
      const tokenId = 1;
      const amount = 5;
      const weight = 25;
      
      await lootBox.addReward(2, mockERC1155.address, tokenId, amount, weight);
      
      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(2);
      expect(reward.tokenId).to.equal(tokenId);
      expect(reward.amount).to.equal(amount);
    });
    
    it("Should toggle reward status", async function () {
      await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("100"), 50);
      
      // Deactivate reward
      await lootBox.toggleReward(0);
      let reward = await lootBox.getReward(0);
      expect(reward.active).to.be.false;
      expect(await lootBox.getTotalWeight()).to.equal(0);
      
      // Reactivate reward
      await lootBox.toggleReward(0);
      reward = await lootBox.getReward(0);
      expect(reward.active).to.be.true;
      expect(await lootBox.getTotalWeight()).to.equal(50);
    });
    
    it("Should only allow owner to add rewards", async function () {
      await expect(
        lootBox.connect(user1).addReward(0, mockERC20.address, 0, 100, 50)
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });
  });

  describe("Box Opening", function () {
    beforeEach(async function () {
      // Add some rewards
      await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("100"), 50);
      await lootBox.addReward(1, mockERC721.address, 1, 0, 10);
      await lootBox.addReward(2, mockERC1155.address, 1, 5, 25);
    });
    
    it("Should open box with correct payment", async function () {
      const tx = await lootBox.connect(user1).openBox({ value: BOX_PRICE });
      const receipt = await tx.wait();
      
      const event = receipt.events?.find((e: any)=> e.event === "BoxOpened");
      expect(event).to.not.be.undefined;
      expect(event?.args?.user).to.equal(user1.address);
      expect(event?.args?.price).to.equal(BOX_PRICE);
    });
    
    it("Should reject insufficient payment", async function () {
      await expect(
        lootBox.connect(user1).openBox({ value: ethers.utils.parseEther("0.005") })
      ).to.be.rejectedWith("Insufficient payment");
    });
    
    it("Should reject opening box with no rewards", async function () {
      const emptyLootBox = await (await ethers.getContractFactory("LootBox")).deploy(
        SUBSCRIPTION_ID,
        mockVRF.address,
        GAS_LANE,
        CALLBACK_GAS_LIMIT
      );
      
      await expect(
        emptyLootBox.connect(user1).openBox({ value: BOX_PRICE })
      ).to.be.rejectedWith("No rewards available");
    });
    
    it("Should complete full box opening flow", async function () {
      // Open box
      const tx = await lootBox.connect(user1).openBox({ value: BOX_PRICE });
      const receipt = await tx.wait();
      
      // Get request ID from event
      const boxOpenedEvent = receipt.events?.find((e: any) => e.event === "BoxOpened");
      const requestId = boxOpenedEvent?.args?.requestId;
      
      // Simulate VRF response with random number
      const randomNumber = BigNumber.from("12345");
      await mockVRF.fulfillRandomWords(requestId, [randomNumber]);
      
      // Check that reward was granted
      const rewardEvents = await lootBox.queryFilter(lootBox.filters.RewardGranted());
      expect(rewardEvents.length).to.equal(1);
      expect(rewardEvents[0].args.user).to.equal(user1.address);
    });
  });

  describe("Weighted Randomness", function () {
    it("Should distribute rewards according to weights", async function () {
      // Add rewards with different weights
      await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("100"), 70); // 70% chance
      await lootBox.addReward(1, mockERC721.address, 1, 0, 20); // 20% chance  
      await lootBox.addReward(2, mockERC1155.address, 1, 5, 10); // 10% chance
      
      const totalWeight = await lootBox.getTotalWeight();
      expect(totalWeight).to.equal(100);
      
      // Test multiple openings to check distribution
      const rewards = { erc20: 0, erc721: 0, erc1155: 0 };
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const tx = await lootBox.connect(user1).openBox({ value: BOX_PRICE });
        const receipt = await tx.wait();
        
        const boxOpenedEvent = receipt.events?.find((e: any)=> e.event === "BoxOpened");
        const requestId = boxOpenedEvent?.args?.requestId;
        
        // Use different random numbers to test distribution
        const randomNumber = BigNumber.from(Math.floor(Math.random() * 100));
        await mockVRF.fulfillRandomWords(requestId, [randomNumber]);
        
        const rewardEvents = await lootBox.queryFilter(
          lootBox.filters.RewardGranted(user1.address)
        );
        const lastEvent = rewardEvents[rewardEvents.length - 1];
        
        if (lastEvent.args.rewardType === 0) rewards.erc20++;
        else if (lastEvent.args.rewardType === 1) rewards.erc721++;
        else if (lastEvent.args.rewardType === 2) rewards.erc1155++;
      }
      
      // ERC20 should have the most occurrences due to higher weight
      expect(rewards.erc20).to.be.greaterThan(rewards.erc721);
      expect(rewards.erc20).to.be.greaterThan(rewards.erc1155);
    });
  });

  describe("Admin Functions", function () {
    it("Should update box price", async function () {
      const newPrice = ethers.utils.parseEther("0.05");
      
      await expect(lootBox.setBoxPrice(newPrice))
        .to.emit(lootBox, "BoxPriceUpdated")
        .withArgs(newPrice);
        
      expect(await lootBox.boxPrice()).to.equal(newPrice);
    });
    
    it("Should withdraw funds", async function () {
      // Add some rewards first
      await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("100"), 50);
      
      // User opens box
      await lootBox.connect(user1).openBox({ value: BOX_PRICE });
      
      const initialBalance = await owner.getBalance();
      const contractBalance = await lootBox.getBalance();
      
      const tx = await lootBox.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const finalBalance = await owner.getBalance();
      
      expect(finalBalance).to.equal(initialBalance.add(contractBalance).sub(gasUsed));
      expect(await lootBox.getBalance()).to.equal(0);
    });
    
    it("Should only allow owner to withdraw", async function () {
      await expect(lootBox.connect(user1).withdraw())
        .to.be.rejectedWith("Ownable: caller is not the owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple box openings", async function () {
      await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("100"), 50);
      
      // Multiple users open boxes
      const users = [user1, user2];
      const promises = users.map(user => 
        lootBox.connect(user).openBox({ value: BOX_PRICE })
      );
      
      await Promise.all(promises);
      
      const boxOpenedEvents = await lootBox.queryFilter(lootBox.filters.BoxOpened());
      expect(boxOpenedEvents.length).to.equal(2);
    });
    
    it("Should handle zero weight scenario", async function () {
      await lootBox.addReward(0, mockERC20.address, 0, ethers.utils.parseEther("100"), 50);
      await lootBox.toggleReward(0); // Deactivate the only reward
      
      await expect(
        lootBox.connect(user1).openBox({ value: BOX_PRICE })
      ).to.be.rejectedWith("No active rewards");
    });
  });
});
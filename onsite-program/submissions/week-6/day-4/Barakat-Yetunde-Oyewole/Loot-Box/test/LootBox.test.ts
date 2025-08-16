import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { LootBox, CustomERC20, CustomERC721, CustomERC1155, CustomVRFCoordinator } from "../typechain-types";

describe("LootBox", function () {
  let lootBox: LootBox;
  let CustomERC20: CustomERC20;
  let CustomERC721: CustomERC721;
  let CustomERC1155: CustomERC1155;
  let CustomVRFCoordinator: CustomVRFCoordinator;
  
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  
  const BOX_PRICE = ethers.parseEther("0.1");
  const SUBSCRIPTION_ID = 1;
  const KEY_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const CustomERC20Factory = await ethers.getContractFactory("CustomERC20");
    CustomERC20 = await CustomERC20Factory.deploy("Test Token", "TTK", ethers.parseEther("10000"));
    
    const CustomERC721Factory = await ethers.getContractFactory("CustomERC721");
    CustomERC721 = await CustomERC721Factory.deploy("Test NFT", "TNFT");
    
    const CustomERC1155Factory = await ethers.getContractFactory("CustomERC1155");
    CustomERC1155 = await CustomERC1155Factory.deploy();
    
    const CustomVRFCoordinatorFactory = await ethers.getContractFactory("CustomVRFCoordinator");
    CustomVRFCoordinator = await CustomVRFCoordinatorFactory.deploy();
    
    const LootBoxFactory = await ethers.getContractFactory("LootBox");
    lootBox = await LootBoxFactory.deploy(
      SUBSCRIPTION_ID,
      await CustomVRFCoordinator.getAddress(),
      KEY_HASH,
      BOX_PRICE
    );
    
    await CustomERC20.mint(await lootBox.getAddress(), ethers.parseEther("1000"));
    
    const nftTokenIds = await CustomERC721.mintBatch(await lootBox.getAddress(), 10);
    
    await CustomERC1155.mint(await lootBox.getAddress(), 1, 100, "0x");
    await CustomERC1155.mint(await lootBox.getAddress(), 2, 50, "0x");
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lootBox.owner()).to.equal(await owner.getAddress());
    });
    
    it("Should set the right box price", async function () {
      expect(await lootBox.boxPrice()).to.equal(BOX_PRICE);
    });
    
    it("Should initialize with zero rewards", async function () {
      expect(await lootBox.getRewardsCount()).to.equal(0);
      expect(await lootBox.totalWeight()).to.equal(0);
    });
  });
  
  describe("Reward Management", function () {
    it("Should add ERC20 reward", async function () {
      const tx = await lootBox.addReward(
        0,
        await CustomERC20.getAddress(),
        0,
        ethers.parseEther("10"),
        100
      );
      
      await expect(tx)
        .to.emit(lootBox, "RewardAdded")
        .withArgs(0, 0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 100);
      
      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(0);
      expect(reward.tokenAddress).to.equal(await CustomERC20.getAddress());
      expect(reward.amount).to.equal(ethers.parseEther("10"));
      expect(reward.weight).to.equal(100);
      expect(reward.isActive).to.be.true;
      
      expect(await lootBox.totalWeight()).to.equal(100);
    });
    
    it("Should add ERC721 reward", async function () {
      const tx = await lootBox.addReward(
        1,
        await CustomERC721.getAddress(),
        0,
        1,
        50
      );
      
      await expect(tx)
        .to.emit(lootBox, "RewardAdded")
        .withArgs(0, 1, await CustomERC721.getAddress(), 0, 1, 50);
      
      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(1);
      expect(reward.tokenAddress).to.equal(await CustomERC721.getAddress());
      expect(reward.tokenId).to.equal(0);
      expect(reward.weight).to.equal(50);
    });
    
    it("Should add ERC1155 reward", async function () {
      const tx = await lootBox.addReward(
        2,
        await CustomERC1155.getAddress(),
        1,
        5,
        25
      );
      
      await expect(tx)
        .to.emit(lootBox, "RewardAdded")
        .withArgs(0, 2, await CustomERC1155.getAddress(), 1, 5, 25);
      
      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(2);
      expect(reward.tokenAddress).to.equal(await CustomERC1155.getAddress());
      expect(reward.tokenId).to.equal(1);
      expect(reward.amount).to.equal(5);
      expect(reward.weight).to.equal(25);
    });
    
    it("Should update reward weight and status", async function () {
      await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 100);
      
      const tx = await lootBox.updateReward(0, 200, false);
      
      await expect(tx)
        .to.emit(lootBox, "RewardUpdated")
        .withArgs(0, 200, false);
      
      const reward = await lootBox.getReward(0);
      expect(reward.weight).to.equal(200);
      expect(reward.isActive).to.be.false;
      expect(await lootBox.totalWeight()).to.equal(0);
    });
    
    it("Should revert when adding reward with zero weight", async function () {
      await expect(
        lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 0)
      ).to.be.revertedWith("Weight must be greater than 0");
    });
    
    it("Should revert when adding reward with zero address", async function () {
      await expect(
        lootBox.addReward(0, ethers.ZeroAddress, 0, ethers.parseEther("10"), 100)
      ).to.be.revertedWith("Invalid token address");
    });
    
    it("Should revert when updating non-existent reward", async function () {
      await expect(
        lootBox.updateReward(0, 100, true)
      ).to.be.revertedWith("Invalid reward index");
    });
    
    it("Should only allow owner to manage rewards", async function () {
      await expect(
        lootBox.connect(user1).addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 100)
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
      
      await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 100);
      
      await expect(
        lootBox.connect(user1).updateReward(0, 200, false)
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Box Opening", function () {
    beforeEach(async function () {
      await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 100);
      await lootBox.addReward(1, await CustomERC721.getAddress(), 0, 1, 50);
      await lootBox.addReward(2, await CustomERC1155.getAddress(), 1, 5, 25);
    });
    
    it("Should open box and request VRF", async function () {
      const tx = await lootBox.connect(user1).openBox({ value: BOX_PRICE });
      
      await expect(tx)
        .to.emit(lootBox, "BoxPurchased");
      
      expect(await lootBox.totalBoxes()).to.equal(1);
      expect(await lootBox.boxesSold()).to.equal(1);
      
      const userBoxes = await lootBox.getUserBoxes(await user1.getAddress());
      expect(userBoxes.length).to.equal(1);
      expect(userBoxes[0]).to.equal(0);
    });
    
    it("Should revert with insufficient payment", async function () {
      await expect(
        lootBox.connect(user1).openBox({ value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Insufficient payment");
    });
    
    it("Should revert with no rewards available", async function () {
      await lootBox.updateReward(0, 0, false);
      await lootBox.updateReward(1, 0, false);
      await lootBox.updateReward(2, 0, false);
      
      await expect(
        lootBox.connect(user1).openBox({ value: BOX_PRICE })
      ).to.be.revertedWith("No rewards available");
    });
    
    it("Should refund excess payment", async function () {
      const initialBalance = await ethers.provider.getBalance(await user1.getAddress());
      const excessPayment = ethers.parseEther("0.2");
      
      const tx = await lootBox.connect(user1).openBox({ value: excessPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(await user1.getAddress());
      const expectedBalance = initialBalance - BOX_PRICE - gasUsed;
      
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });
    
    it("Should fulfill VRF request and distribute reward", async function () {
      const tx = await lootBox.connect(user1).openBox({ value: BOX_PRICE });
      const receipt = await tx.wait();
      
      const boxPurchasedEvent = receipt!.logs.find(
        (log) => log.topics[0] === lootBox.interface.getEvent("BoxPurchased").topicHash
      );
      
      expect(boxPurchasedEvent).to.not.be.undefined;
      const parsedEvent = lootBox.interface.parseLog(boxPurchasedEvent!)!;
      const requestId = parsedEvent.args.requestId;
      
      const randomNumber = await CustomVRFCoordinator.generateRandomNumber(42);
      
      const fulfillTx = await CustomVRFCoordinator.fulfillRandomWords(requestId, [randomNumber]);
      
      await expect(fulfillTx)
        .to.emit(lootBox, "BoxOpened");
      
      const request = await lootBox.vrfRequests(requestId);
      expect(request.fulfilled).to.be.true;
      
      const boxReward = await lootBox.getBoxReward(0);
      expect(boxReward.tokenAddress).to.not.equal(ethers.ZeroAddress);
    });
  });
  
  describe("Weighted Random Selection", function () {
    beforeEach(async function () {
      await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("1"), 700);
      await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 200);
      await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("100"), 100);
    });
    
    it("Should distribute rewards according to weights over multiple openings", async function () {
      const results = { reward0: 0, reward1: 0, reward2: 0 };
      const numTests = 20;
      
      for (let i = 0; i < numTests; i++) {
        const tx = await lootBox.connect(user1).openBox({ value: BOX_PRICE });
        const receipt = await tx.wait();
        
        const boxPurchasedEvent = receipt!.logs.find(
          (log) => log.topics[0] === lootBox.interface.getEvent("BoxPurchased").topicHash
        );
        const parsedEvent = lootBox.interface.parseLog(boxPurchasedEvent!)!;
        const requestId = parsedEvent.args.requestId;
        
        const randomNumber = await CustomVRFCoordinator.generateRandomNumber(i + 100);
        const fulfillTx = await CustomVRFCoordinator.fulfillRandomWords(requestId, [randomNumber]);
        const fulfillReceipt = await fulfillTx.wait();
        
        const boxOpenedEvent = fulfillReceipt!.logs.find(
          (log) => log.topics[0] === lootBox.interface.getEvent("BoxOpened").topicHash
        );
        const openedEvent = lootBox.interface.parseLog(boxOpenedEvent!)!;
        const rewardIndex = Number(openedEvent.args.rewardIndex);
        
        if (rewardIndex === 0) results.reward0++;
        else if (rewardIndex === 1) results.reward1++;
        else if (rewardIndex === 2) results.reward2++;
      }
      
      expect(results.reward0).to.be.greaterThan(results.reward1);
      expect(results.reward1).to.be.greaterThan(0);
      expect(results.reward2).to.be.greaterThan(0);
      
      console.log("Distribution:", results);
    });
  });
  
  describe("Administrative Functions", function () {
    it("Should allow owner to update box price", async function () {
      const newPrice = ethers.parseEther("0.2");
      const tx = await lootBox.setBoxPrice(newPrice);
      
      await expect(tx)
        .to.emit(lootBox, "BoxPriceUpdated")
        .withArgs(newPrice);
      
      expect(await lootBox.boxPrice()).to.equal(newPrice);
    });
    
    it("Should allow owner to withdraw funds", async function () {
      await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 100);
      await lootBox.connect(user1).openBox({ value: BOX_PRICE });
      
      const initialOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());
      const contractBalance = await ethers.provider.getBalance(await lootBox.getAddress());
      
      const tx = await lootBox.withdrawFunds();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      await expect(tx)
        .to.emit(lootBox, "FundsWithdrawn")
        .withArgs(await owner.getAddress(), contractBalance);
      
      const finalOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());
      const expectedBalance = initialOwnerBalance + contractBalance - gasUsed;
      
      expect(finalOwnerBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });
    
    it("Should allow owner to emergency withdraw tokens", async function () {
      const initialBalance = await CustomERC20.balanceOf(await owner.getAddress());
      const withdrawAmount = ethers.parseEther("100");
      
      await lootBox.emergencyWithdrawERC20(await CustomERC20.getAddress(), withdrawAmount);
      
      const finalBalance = await CustomERC20.balanceOf(await owner.getAddress());
      expect(finalBalance).to.equal(initialBalance + withdrawAmount);
    });
    
    it("Should only allow owner to call administrative functions", async function () {
      await expect(
        lootBox.connect(user1).setBoxPrice(ethers.parseEther("0.2"))
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
      
      await expect(
        lootBox.connect(user1).withdrawFunds()
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
      
      await expect(
        lootBox.connect(user1).emergencyWithdrawERC20(await CustomERC20.getAddress(), 100)
      ).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("View Functions", function () {
    beforeEach(async function () {
      await lootBox.addReward(0, await CustomERC20.getAddress(), 0, ethers.parseEther("10"), 100);
      await lootBox.addReward(1, await CustomERC721.getAddress(), 0, 1, 50);
    });
    
    it("Should return correct rewards count", async function () {
      expect(await lootBox.getRewardsCount()).to.equal(2);
    });
    
    it("Should return correct reward details", async function () {
      const reward = await lootBox.getReward(0);
      expect(reward.rewardType).to.equal(0);
      expect(reward.tokenAddress).to.equal(await CustomERC20.getAddress());
      expect(reward.amount).to.equal(ethers.parseEther("10"));
      expect(reward.weight).to.equal(100);
    });
    
    it("Should return user boxes", async function () {
      await lootBox.connect(user1).openBox({ value: BOX_PRICE });
      await lootBox.connect(user1).openBox({ value: BOX_PRICE });
      
      const userBoxes = await lootBox.getUserBoxes(await user1.getAddress());
      expect(userBoxes.length).to.equal(2);
      expect(userBoxes[0]).to.equal(0);
      expect(userBoxes[1]).to.equal(1);
    });
    
    it("Should revert when getting invalid reward index", async function () {
      await expect(lootBox.getReward(10)).to.be.revertedWith("Invalid index");
    });
  });
});
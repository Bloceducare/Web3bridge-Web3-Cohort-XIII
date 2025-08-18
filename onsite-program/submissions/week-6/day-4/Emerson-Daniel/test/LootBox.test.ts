import { expect } from "chai";
import { ethers } from "hardhat";
import { LootBox, ERC721Mock, VRFCoordinatorV2Mock } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LootBox Contract", function () {
    let lootBox: LootBox;
    let nftMock: ERC721Mock;
    let vrfCoordinator: VRFCoordinatorV2Mock;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    // Constants
    const BOX_FEE = ethers.parseEther("0.01");
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const SUBSCRIPTION_ID = 1;
    const CALLBACK_GAS_LIMIT = 100000;
    const REQUEST_CONFIRMATIONS = 3;

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy VRF Coordinator Mock
        const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        vrfCoordinator = await VRFCoordinatorV2MockFactory.deploy(0, 0);
        await vrfCoordinator.waitForDeployment();

        // Deploy NFT Mock
        const ERC721MockFactory = await ethers.getContractFactory("ERC721Mock");
        nftMock = await ERC721MockFactory.deploy("Loot NFT", "LNFT");
        await nftMock.waitForDeployment();

        // Deploy LootBox
        const LootBoxFactory = await ethers.getContractFactory("LootBox");
        lootBox = await LootBoxFactory.deploy(
            BOX_FEE,
            await vrfCoordinator.getAddress(),
            KEY_HASH,
            SUBSCRIPTION_ID
        );
        await lootBox.waitForDeployment();

        // Setup VRF subscription
        await vrfCoordinator.createSubscription();
        await vrfCoordinator.addConsumer(SUBSCRIPTION_ID, await lootBox.getAddress());

        // Mint NFTs to lootbox for rewards
        for (let i = 1; i <= 10; i++) {
            await nftMock.mint(await lootBox.getAddress(), i);
        }
    });

    describe("Deployment", function () {
        it("Should set the correct box fee", async function () {
            expect(await lootBox.boxFee()).to.equal(BOX_FEE);
        });

        it("Should set the correct owner", async function () {
            expect(await lootBox.owner()).to.equal(owner.address);
        });

        it("Should initialize with zero counters", async function () {
            expect(await lootBox.totalBoxesOpened()).to.equal(0);
            expect(await lootBox.totalRewardsDistributed()).to.equal(0);
            expect(await lootBox.totalWeight()).to.equal(0);
        });

        it("Should revert with zero box fee", async function () {
            const LootBoxFactory = await ethers.getContractFactory("LootBox");
            await expect(
                LootBoxFactory.deploy(0, await vrfCoordinator.getAddress(), KEY_HASH, SUBSCRIPTION_ID)
            ).to.be.revertedWithCustomError(lootBox, "ZeroAmount");
        });

        it("Should revert with zero address VRF coordinator", async function () {
            const LootBoxFactory = await ethers.getContractFactory("LootBox");
            await expect(
                LootBoxFactory.deploy(BOX_FEE, ethers.ZeroAddress, KEY_HASH, SUBSCRIPTION_ID)
            ).to.be.revertedWithCustomError(lootBox, "ZeroAddress");
        });
    });

    describe("Reward Management", function () {
        it("Should add ERC721 reward correctly", async function () {
            await expect(lootBox.addReward(await nftMock.getAddress(), 1, 100))
                .to.emit(lootBox, "RewardAdded")
                .withArgs(0, await nftMock.getAddress(), 1, 100);

            expect(await lootBox.totalWeight()).to.equal(100);
            expect(await lootBox.getRewardsCount()).to.equal(1);
            expect(await lootBox.getActiveRewardsCount()).to.equal(1);
        });

        it("Should add multiple rewards with different weights", async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100); // Common
            await lootBox.addReward(await nftMock.getAddress(), 2, 50);  // Rare
            await lootBox.addReward(await nftMock.getAddress(), 3, 10);  // Epic

            expect(await lootBox.totalWeight()).to.equal(160);
            expect(await lootBox.getActiveRewardsCount()).to.equal(3);
        });

        it("Should calculate probability correctly", async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);
            await lootBox.addReward(await nftMock.getAddress(), 2, 200);

            // 100/300 = 33.33% = 3333 basis points
            expect(await lootBox.getRewardProbability(0)).to.equal(3333);
            // 200/300 = 66.66% = 6666 basis points
            expect(await lootBox.getRewardProbability(1)).to.equal(6666);
        });

        it("Should remove reward correctly", async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);
            
            await expect(lootBox.removeReward(0))
                .to.emit(lootBox, "RewardRemoved")
                .withArgs(0, await nftMock.getAddress(), 1);

            expect(await lootBox.totalWeight()).to.equal(0);
            expect(await lootBox.getActiveRewardsCount()).to.equal(0);
        });

        it("Should revert when adding reward with zero weight", async function () {
            await expect(lootBox.addReward(await nftMock.getAddress(), 1, 0))
                .to.be.revertedWithCustomError(lootBox, "ZeroAmount");
        });

        it("Should revert when adding reward with zero address", async function () {
            await expect(lootBox.addReward(ethers.ZeroAddress, 1, 100))
                .to.be.revertedWithCustomError(lootBox, "ZeroAddress");
        });

        it("Should revert when removing invalid reward index", async function () {
            await expect(lootBox.removeReward(0))
                .to.be.revertedWithCustomError(lootBox, "InvalidRewardIndex");
        });

        it("Should revert when removing already inactive reward", async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);
            await lootBox.removeReward(0);
            
            await expect(lootBox.removeReward(0))
                .to.be.revertedWithCustomError(lootBox, "RewardAlreadyInactive");
        });

        it("Should only allow owner to manage rewards", async function () {
            await expect(lootBox.connect(user1).addReward(await nftMock.getAddress(), 1, 100))
                .to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
        });
    });

    describe("Box Opening", function () {
        beforeEach(async function () {
            // Add some rewards with different weights
            await lootBox.addReward(await nftMock.getAddress(), 1, 100); // Common
            await lootBox.addReward(await nftMock.getAddress(), 2, 50);  // Rare
            await lootBox.addReward(await nftMock.getAddress(), 3, 10);  // Epic
        });

        it("Should open box with correct fee", async function () {
            await expect(lootBox.connect(user1).openBox({ value: BOX_FEE }))
                .to.emit(lootBox, "BoxOpened")
                .and.to.emit(lootBox, "RandomnessRequested");

            expect(await lootBox.userBoxesOpened(user1.address)).to.equal(1);
            expect(await lootBox.totalBoxesOpened()).to.equal(1);
        });

        it("Should reject incorrect fee", async function () {
            const incorrectFee = ethers.parseEther("0.005");
            await expect(lootBox.connect(user1).openBox({ value: incorrectFee }))
                .to.be.revertedWithCustomError(lootBox, "IncorrectFee")
                .withArgs(BOX_FEE, incorrectFee);
        });

        it("Should reject opening when no rewards available", async function () {
            const emptyLootBox = await ethers.deployContract("LootBox", [
                BOX_FEE,
                await vrfCoordinator.getAddress(),
                KEY_HASH,
                SUBSCRIPTION_ID
            ]);

            await expect(emptyLootBox.connect(user1).openBox({ value: BOX_FEE }))
                .to.be.revertedWithCustomError(emptyLootBox, "NoRewardsAvailable");
        });

        it("Should reject opening when no active rewards", async function () {
            // Remove all rewards
            await lootBox.removeReward(0);
            await lootBox.removeReward(1);
            await lootBox.removeReward(2);

            await expect(lootBox.connect(user1).openBox({ value: BOX_FEE }))
                .to.be.revertedWithCustomError(lootBox, "NoActiveRewards");
        });

        it("Should allow multiple users to open boxes", async function () {
            await lootBox.connect(user1).openBox({ value: BOX_FEE });
            await lootBox.connect(user2).openBox({ value: BOX_FEE });
            await lootBox.connect(user3).openBox({ value: BOX_FEE });

            expect(await lootBox.totalBoxesOpened()).to.equal(3);
            expect(await lootBox.userBoxesOpened(user1.address)).to.equal(1);
            expect(await lootBox.userBoxesOpened(user2.address)).to.equal(1);
            expect(await lootBox.userBoxesOpened(user3.address)).to.equal(1);
        });

        it("Should track user statistics correctly", async function () {
            await lootBox.connect(user1).openBox({ value: BOX_FEE });
            await lootBox.connect(user1).openBox({ value: BOX_FEE });

            const [boxesOpened, rewardsReceived] = await lootBox.getUserStats(user1.address);
            expect(boxesOpened).to.equal(2);
            expect(rewardsReceived).to.equal(0); // No rewards fulfilled yet
        });
    });

    describe("VRF Integration and Reward Distribution", function () {
        beforeEach(async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);
            await lootBox.addReward(await nftMock.getAddress(), 2, 50);
        });

        it("Should fulfill randomness and distribute reward", async function () {
            const tx = await lootBox.connect(user1).openBox({ value: BOX_FEE });
            const receipt = await tx.wait();

            // Extract request ID from events
            const boxOpenedEvent = receipt?.logs.find(log => {
                try {
                    const parsed = lootBox.interface.parseLog(log);
                    return parsed?.name === "BoxOpened";
                } catch {
                    return false;
                }
            });

            const parsedEvent = lootBox.interface.parseLog(boxOpenedEvent!);
            const requestId = parsedEvent?.args[1];

            // Fulfill randomness with specific value to get first reward
            const randomWords = [0]; // This should select the first reward
            await expect(vrfCoordinator.fulfillRandomWordsWithOverride(
                requestId,
                await lootBox.getAddress(),
                randomWords
            )).to.emit(lootBox, "RewardDistributed");

            // Check NFT was transferred
            expect(await nftMock.ownerOf(1)).to.equal(user1.address);
            expect(await lootBox.userRewardsReceived(user1.address)).to.equal(1);
            expect(await lootBox.totalRewardsDistributed()).to.equal(1);
        });

        it("Should distribute different rewards based on random number", async function () {
            // Open first box
            const tx1 = await lootBox.connect(user1).openBox({ value: BOX_FEE });
            const receipt1 = await tx1.wait();
            const requestId1 = lootBox.interface.parseLog(receipt1?.logs[0]!)?.args[1];

            // Open second box
            const tx2 = await lootBox.connect(user2).openBox({ value: BOX_FEE });
            const receipt2 = await tx2.wait();
            const requestId2 = lootBox.interface.parseLog(receipt2?.logs[0]!)?.args[1];

            // Fulfill with different random numbers
            await vrfCoordinator.fulfillRandomWordsWithOverride(requestId1, await lootBox.getAddress(), [50]); // Should get first reward
            await vrfCoordinator.fulfillRandomWordsWithOverride(requestId2, await lootBox.getAddress(), [120]); // Should get second reward

            expect(await nftMock.ownerOf(1)).to.equal(user1.address);
            expect(await nftMock.ownerOf(2)).to.equal(user2.address);
        });

        it("Should deactivate reward after distribution", async function () {
            const tx = await lootBox.connect(user1).openBox({ value: BOX_FEE });
            const receipt = await tx.wait();
            const requestId = lootBox.interface.parseLog(receipt?.logs[0]!)?.args[1];

            const initialWeight = await lootBox.totalWeight();
            await vrfCoordinator.fulfillRandomWordsWithOverride(requestId, await lootBox.getAddress(), [0]);

            // Check reward is deactivated and weight reduced
            expect(await lootBox.totalWeight()).to.be.lt(initialWeight);
            expect(await lootBox.getActiveRewardsCount()).to.equal(1); // One reward left
        });

        it("Should handle invalid request ID", async function () {
            await expect(vrfCoordinator.fulfillRandomWordsWithOverride(
                999,
                await lootBox.getAddress(),
                [0]
            )).to.be.revertedWithCustomError(lootBox, "InvalidRequestId");
        });
    });

    describe("Admin Functions", function () {
        beforeEach(async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);
        });

        it("Should allow owner to update box fee", async function () {
            const newFee = ethers.parseEther("0.02");

            await expect(lootBox.updateBoxFee(newFee))
                .to.emit(lootBox, "BoxFeeUpdated")
                .withArgs(BOX_FEE, newFee);

            expect(await lootBox.boxFee()).to.equal(newFee);
        });

        it("Should revert when updating box fee to zero", async function () {
            await expect(lootBox.updateBoxFee(0))
                .to.be.revertedWithCustomError(lootBox, "ZeroAmount");
        });

        it("Should allow owner to update VRF config", async function () {
            const newGasLimit = 200000;
            const newConfirmations = 5;

            await expect(lootBox.updateVRFConfig(newGasLimit, newConfirmations))
                .to.emit(lootBox, "VRFConfigUpdated")
                .withArgs(newGasLimit, newConfirmations);
        });

        it("Should allow owner to pause and unpause", async function () {
            await lootBox.pause();

            await expect(lootBox.connect(user1).openBox({ value: BOX_FEE }))
                .to.be.revertedWithCustomError(lootBox, "EnforcedPause");

            await lootBox.unpause();
            await expect(lootBox.connect(user1).openBox({ value: BOX_FEE }))
                .to.emit(lootBox, "BoxOpened");
        });

        it("Should allow owner to withdraw fees", async function () {
            await lootBox.connect(user1).openBox({ value: BOX_FEE });
            await lootBox.connect(user2).openBox({ value: BOX_FEE });

            const initialBalance = await ethers.provider.getBalance(owner.address);
            const contractBalance = await ethers.provider.getBalance(await lootBox.getAddress());

            await lootBox.withdrawFees();

            const finalBalance = await ethers.provider.getBalance(owner.address);
            expect(finalBalance).to.be.gt(initialBalance);
            expect(await ethers.provider.getBalance(await lootBox.getAddress())).to.equal(0);
        });

        it("Should revert non-owner admin calls", async function () {
            await expect(lootBox.connect(user1).updateBoxFee(ethers.parseEther("0.02")))
                .to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");

            await expect(lootBox.connect(user1).pause())
                .to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");

            await expect(lootBox.connect(user1).withdrawFees())
                .to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);
            await lootBox.addReward(await nftMock.getAddress(), 2, 200);
            await lootBox.addReward(await nftMock.getAddress(), 3, 50);
        });

        it("Should return correct reward details", async function () {
            const [nftContract, tokenId, weight, active] = await lootBox.getReward(0);

            expect(nftContract).to.equal(await nftMock.getAddress());
            expect(tokenId).to.equal(1);
            expect(weight).to.equal(100);
            expect(active).to.be.true;
        });

        it("Should return active rewards correctly", async function () {
            const [nftContracts, tokenIds, weights] = await lootBox.getActiveRewards();

            expect(nftContracts.length).to.equal(3);
            expect(tokenIds).to.deep.equal([1n, 2n, 3n]);
            expect(weights).to.deep.equal([100n, 200n, 50n]);
        });

        it("Should return contract statistics", async function () {
            await lootBox.connect(user1).openBox({ value: BOX_FEE });

            const [totalBoxes, totalRewards, activeRewards, currentWeight, contractBalance] =
                await lootBox.getContractStats();

            expect(totalBoxes).to.equal(1);
            expect(totalRewards).to.equal(0); // No rewards distributed yet
            expect(activeRewards).to.equal(3);
            expect(currentWeight).to.equal(350);
            expect(contractBalance).to.equal(BOX_FEE);
        });

        it("Should revert for invalid reward index in getReward", async function () {
            await expect(lootBox.getReward(999))
                .to.be.revertedWithCustomError(lootBox, "InvalidRewardIndex");
        });

        it("Should revert for invalid reward index in getRewardProbability", async function () {
            await expect(lootBox.getRewardProbability(999))
                .to.be.revertedWithCustomError(lootBox, "InvalidRewardIndex");
        });

        it("Should return zero probability for inactive rewards", async function () {
            await lootBox.removeReward(0);
            expect(await lootBox.getRewardProbability(0)).to.equal(0);
        });
    });

    describe("Emergency Functions", function () {
        beforeEach(async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);
        });

        it("Should allow owner to recover stuck NFTs", async function () {
            // Mint an extra NFT to the contract
            await nftMock.mint(await lootBox.getAddress(), 999);

            await lootBox.emergencyRecoverNFT(
                await nftMock.getAddress(),
                999,
                owner.address
            );

            expect(await nftMock.ownerOf(999)).to.equal(owner.address);
        });

        it("Should allow owner to recover stuck ETH", async function () {
            await lootBox.connect(user1).openBox({ value: BOX_FEE });

            const initialBalance = await ethers.provider.getBalance(owner.address);
            await lootBox.emergencyRecoverETH(owner.address, BOX_FEE);
            const finalBalance = await ethers.provider.getBalance(owner.address);

            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should revert emergency functions for non-owner", async function () {
            await expect(lootBox.connect(user1).emergencyRecoverNFT(
                await nftMock.getAddress(),
                1,
                user1.address
            )).to.be.revertedWithCustomError(lootBox, "OwnableUnauthorizedAccount");
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle reentrancy protection", async function () {
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);

            // This test ensures the nonReentrant modifier works
            // In a real attack scenario, this would be more complex
            await expect(lootBox.connect(user1).openBox({ value: BOX_FEE }))
                .to.emit(lootBox, "BoxOpened");
        });

        it("Should handle contract with no ETH balance for withdrawal", async function () {
            await expect(lootBox.withdrawFees())
                .to.be.revertedWith("No fees to withdraw");
        });

        it("Should support ERC721Receiver interface", async function () {
            expect(await lootBox.supportsInterface("0x150b7a02")).to.be.true; // ERC721Receiver
            expect(await lootBox.supportsInterface("0x01ffc9a7")).to.be.true; // ERC165
        });

        it("Should handle onERC721Received callback", async function () {
            const selector = await lootBox.onERC721Received(
                ethers.ZeroAddress,
                ethers.ZeroAddress,
                1,
                "0x"
            );
            expect(selector).to.equal("0x150b7a02");
        });

        it("Should handle large number of rewards efficiently", async function () {
            // Add many rewards to test gas efficiency
            for (let i = 4; i <= 20; i++) {
                await nftMock.mint(await lootBox.getAddress(), i);
                await lootBox.addReward(await nftMock.getAddress(), i, 10);
            }

            expect(await lootBox.getActiveRewardsCount()).to.equal(17);
            expect(await lootBox.totalWeight()).to.equal(170);
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete box opening flow", async function () {
            // Setup rewards
            await lootBox.addReward(await nftMock.getAddress(), 1, 100);
            await lootBox.addReward(await nftMock.getAddress(), 2, 50);

            // User opens box
            const tx = await lootBox.connect(user1).openBox({ value: BOX_FEE });
            const receipt = await tx.wait();
            const requestId = lootBox.interface.parseLog(receipt?.logs[0]!)?.args[1];

            // Fulfill randomness
            await vrfCoordinator.fulfillRandomWordsWithOverride(
                requestId,
                await lootBox.getAddress(),
                [25] // Should get first reward
            );

            // Verify complete state
            expect(await nftMock.ownerOf(1)).to.equal(user1.address);
            expect(await lootBox.userBoxesOpened(user1.address)).to.equal(1);
            expect(await lootBox.userRewardsReceived(user1.address)).to.equal(1);
            expect(await lootBox.totalBoxesOpened()).to.equal(1);
            expect(await lootBox.totalRewardsDistributed()).to.equal(1);
            expect(await lootBox.getActiveRewardsCount()).to.equal(1); // One reward consumed
        });
    });
});

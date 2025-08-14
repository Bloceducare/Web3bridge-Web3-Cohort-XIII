import { expect } from "chai";
import { Signer } from "ethers";
import { network } from "hardhat";
import { RewardERC20 } from "../types/ethers-contracts/MyERC20.sol/RewardERC20.js";
import { RewardERC721 } from "../types/ethers-contracts/MyERC721.sol/RewardERC721.js";
import { RewardERC1155 } from "../types/ethers-contracts/MyERC1155.sol/RewardERC1155.js";
import { LootBox } from "../types/ethers-contracts/LootBox.js";

const { ethers } = await network.connect({
  network: "lisk-sepolia",
  chainType: "l1",
});


describe("LootBox", () => {
  let lootBox: LootBox;
  let mockERC20: RewardERC20;
  let mockERC721: RewardERC721;
  let mockERC1155: RewardERC1155;
  let owner: Signer;
  let user: Signer;
  const FEE = ethers.parseEther("0.1");
  const ERC20_AMOUNT = ethers.parseUnits("100", 18);
  const ERC1155_ID = 1;
  const ERC1155_AMOUNT = 1;
  const WEIGHTS = [50, 30, 20];
  const TOTAL_WEIGHT = 100;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mock reward contracts
    const MockERC20 = await ethers.getContractFactory("RewardERC20");
    mockERC20 = await MockERC20.deploy();
    await mockERC20.waitForDeployment();

    const MockERC721 = await ethers.getContractFactory("RewardERC721");
    mockERC721 = await MockERC721.deploy();
    await mockERC721.waitForDeployment();

    const MockERC1155 = await ethers.getContractFactory("RewardERC1155");
    mockERC1155 = await MockERC1155.deploy();
    await mockERC1155.waitForDeployment();

    // Deploy LootBox
    const LootBox = await ethers.getContractFactory("LootBox");
    lootBox = await LootBox.deploy(
      mockERC20.getAddress(),
      mockERC721.getAddress(),
      mockERC1155.getAddress()
    );
    await lootBox.waitForDeployment();

    // Transfer ownership of reward contracts to LootBox
    await mockERC20.transferOwnership(lootBox.getAddress());
    await mockERC721.transferOwnership(lootBox.getAddress());
    await mockERC1155.transferOwnership(lootBox.getAddress());
  });

  it("should allow user to open box and receive a reward", async () => {
    const userAddress = await user.getAddress();

    // Call openBox
    const tx = await lootBox.connect(user).openBox({ value: FEE });
    const receipt = await tx.wait();

    // Check events
    expect(receipt).to.emit(lootBox, "BoxOpened").withArgs(userAddress, FEE);
    // expect(receipt).to.emit(lootBox, "RandomNumberGenerated").withArgs(userAddress, ethers.hexValue);

    // Get user reward
    const reward = await lootBox.userRewards(userAddress);

    // Verify random number
    expect(reward.randomNumber).to.be.gt(0);

    // Check reward distribution based on type
    const rewardType = Number(reward.rewardType);
    if (rewardType === 0) { // ERC20
      expect(await mockERC20.balanceOf(userAddress)).to.equal(ERC20_AMOUNT);
    } else if (rewardType === 1) { // ERC721
      expect(await mockERC721.balanceOf(userAddress)).to.equal(1);
    } else if (rewardType === 2) { // ERC1155
      expect(await mockERC1155.balanceOf(userAddress, ERC1155_ID)).to.equal(ERC1155_AMOUNT);
    }
  });

  it("should allow owner to withdraw funds", async () => {
    const ownerAddress = await owner.getAddress();

    // User opens a box
    await lootBox.connect(user).openBox({ value: FEE });

    // Check contract balance
    expect(await ethers.provider.getBalance(lootBox.getAddress())).to.equal(FEE);

    // Withdraw
    const balanceBefore = await ethers.provider.getBalance(ownerAddress);
    const tx = await lootBox.withdraw();
    const receipt = await tx.wait();

    // Check Withdraw event
    expect(receipt).to.emit(lootBox, "Withdraw").withArgs(ownerAddress, FEE);

    // Check owner balance increased
    const balanceAfter = await ethers.provider.getBalance(ownerAddress);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("should revert if incorrect fee is sent", async () => {
    await expect(
      lootBox.connect(user).openBox({ value: ethers.parseEther("0.05") })
    ).to.be.revertedWith("Incorrect fee");
  });
});
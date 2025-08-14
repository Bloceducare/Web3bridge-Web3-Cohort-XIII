import { expect } from "chai";
import { Contract, BigNumber, Signer } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "hardhatOp",
  chainType: "l1",
});


describe("LootBox", () => {
  let lootBox: Contract;
  let mockERC20: Contract;
  let mockERC721: Contract;
  let mockERC1155: Contract;
  let owner: Signer;
  let user: Signer;
  const FEE = ethers.utils.parseEther("0.1");
  const ERC20_AMOUNT = ethers.utils.parseUnits("100", 18);
  const ERC1155_ID = 1;
  const ERC1155_AMOUNT = 1;
  const WEIGHTS = [50, 30, 20];
  const TOTAL_WEIGHT = 100;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mock reward contracts
    const MockERC20 = await ethers.getContractFactory("RewardERC20");
    mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    const MockERC721 = await ethers.getContractFactory("RewardERC721");
    mockERC721 = await MockERC721.deploy();
    await mockERC721.deployed();

    const MockERC1155 = await ethers.getContractFactory("RewardERC1155");
    mockERC1155 = await MockERC1155.deploy();
    await mockERC1155.deployed();

    // Deploy LootBox
    const LootBox = await ethers.getContractFactory("LootBox");
    lootBox = await LootBox.deploy(
      mockERC20.address,
      mockERC721.address,
      mockERC1155.address
    );
    await lootBox.deployed();

    // Transfer ownership of reward contracts to LootBox
    await mockERC20.transferOwnership(lootBox.address);
    await mockERC721.transferOwnership(lootBox.address);
    await mockERC1155.transferOwnership(lootBox.address);
  });

  it("should allow user to open box and receive a reward", async () => {
    const userAddress = await user.getAddress();

    // Call openBox
    const tx = await lootBox.connect(user).openBox({ value: FEE });
    const receipt = await tx.wait();

    // Check events
    expect(receipt.events).to.emit(lootBox, "BoxOpened").withArgs(userAddress, FEE);
    expect(receipt.events).to.emit(lootBox, "RandomNumberGenerated").withArgs(userAddress, ethers.utils.hexValue);

    // Get user reward
    const reward = await lootBox.userRewards(userAddress);

    // Verify random number
    expect(reward.randomNumber).to.be.gt(0);

    // Check reward distribution based on type
    const rewardType = reward.rewardType.toNumber();
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
    expect(await ethers.provider.getBalance(lootBox.address)).to.equal(FEE);

    // Withdraw
    const balanceBefore = await ethers.provider.getBalance(ownerAddress);
    const tx = await lootBox.withdraw();
    const receipt = await tx.wait();

    // Check Withdraw event
    expect(receipt.events).to.emit(lootBox, "Withdraw").withArgs(ownerAddress, FEE);

    // Check owner balance increased
    const balanceAfter = await ethers.provider.getBalance(ownerAddress);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("should revert if incorrect fee is sent", async () => {
    await expect(
      lootBox.connect(user).openBox({ value: ethers.utils.parseEther("0.05") })
    ).to.be.revertedWith("Incorrect fee");
  });
});
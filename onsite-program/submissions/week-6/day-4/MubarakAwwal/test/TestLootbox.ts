import { expect } from "chai";
import { ethers } from "hardhat";

describe("LootBox", function () {
  it("should deploy, fund, open, and reward correctly", async function () {
    const [owner, user] = await ethers.getSigners();

    // ===== Deploy Random Generator =====
    const RNG = await ethers.getContractFactory("RandomGenerator");
    const rng = await RNG.deploy();
    await rng.waitForDeployment();

    // ===== Deploy LootBox =====
    const fee = ethers.parseEther("1");
    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(await rng.getAddress(), fee);
    await lootBox.waitForDeployment();

    // ===== Deploy Mock ERC20, ERC721, ERC1155 =====
    const ERC20 = await ethers.getContractFactory("MockERC20");
    const erc20 = await ERC20.deploy("Mock Token", "MTK");
    await erc20.waitForDeployment();

    const ERC721 = await ethers.getContractFactory("MockERC721");
    const erc721 = await ERC721.deploy("Mock NFT", "MNFT");
    await erc721.waitForDeployment();

    const ERC1155 = await ethers.getContractFactory("MockERC1155");
    const erc1155 = await ERC1155.deploy();
    await erc1155.waitForDeployment();

    // ===== Mint rewards to LootBox =====
    // ERC20 reward
    await erc20.mint(await lootBox.getAddress(), ethers.parseEther("100"));

    // ERC721 reward
    await erc721.mint(await lootBox.getAddress(), 1);

    // ERC1155 reward
    await erc1155.mint(await lootBox.getAddress(), 5, 10, "0x");

    // ===== Add rewards to LootBox =====
    await lootBox.addERC20Reward(await erc20.getAddress(), ethers.parseEther("10"), 50); // 50% weight
    await lootBox.addERC721Reward(await erc721.getAddress(), 1, 30); // 30% weight
    await lootBox.addERC1155Reward(await erc1155.getAddress(), 5, 1, 20); // 20% weight

    // ===== User opens loot box =====
    await expect(
      lootBox.connect(user).openBox({ value: fee })
    ).to.emit(lootBox, "BoxOpened");

    // ===== Check fees accumulated =====
    const balance = await ethers.provider.getBalance(await lootBox.getAddress());
    expect(balance).to.equal(fee);

    // ===== Owner withdraws fees =====
    await lootBox.withdrawFees();
    const balanceAfter = await ethers.provider.getBalance(await lootBox.getAddress());
    expect(balanceAfter).to.equal(0);
  });
});

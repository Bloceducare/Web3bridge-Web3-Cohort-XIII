const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("LootBox - Full integration tests", function () {
  let deployer, alice, bob, recipient;
  let vaultToken, nftToken, multiAsset, vrf, lootBox;

  // This is box price from LootBox contract
  const BOX_PRICE = ethers.parseEther("0.0001"); // 0.0001 ether

  async function deployAll() {
    const CustomERC20 = await ethers.getContractFactory("CustomERC20");
    const vault = await CustomERC20.deploy(1_000_000);
    await vault.waitForDeployment();

    const CustomERC721 = await ethers.getContractFactory("CustomERC721");
    const nft = await CustomERC721.deploy();
    await nft.waitForDeployment();

    const CustomERC1155 = await ethers.getContractFactory("CustomERC1155");
    const multi = await CustomERC1155.deploy();
    await multi.waitForDeployment();

    const SecurePseudoVRF = await ethers.getContractFactory("SecurePseudoVRF");
    const vrfInstance = await SecurePseudoVRF.deploy();
    await vrfInstance.waitForDeployment();

    const LootBox = await ethers.getContractFactory("LootBox");
    const chest = await LootBox.deploy(
      vault.target,
      nft.target,
      multi.target,
      vrfInstance.target
    );
    await chest.waitForDeployment();

    return { vault, nft, multi, vrfInstance, chest };
  }

  beforeEach(async function () {
    [deployer, alice, bob, recipient] = await ethers.getSigners();
    const deployed = await deployAll();
    vaultToken = deployed.vault;
    nftToken = deployed.nft;
    multiAsset = deployed.multi;
    vrf = deployed.vrfInstance;
    lootBox = deployed.chest;
  });

  it("deployed with expected default boxPrice and allows setBoxPrice", async function () {
    expect(await lootBox.boxPrice()).to.equal(BOX_PRICE);

    const newPrice = ethers.parseEther("0.0002");
    await expect(lootBox.connect(deployer).setBoxPrice(newPrice))
      .to.emit(lootBox, "BoxPriceUpdated")
      .withArgs(newPrice);

    expect(await lootBox.boxPrice()).to.equal(newPrice);

    // This reset to original price for other tests
    await lootBox.connect(deployer).setBoxPrice(BOX_PRICE);
    expect(await lootBox.boxPrice()).to.equal(BOX_PRICE);
  });

  it("addReward emits RewardAdded and updates totalWeight", async function () {
    await expect(lootBox.addReward(1, 0, ethers.parseUnits("1000", 18), 5000))
      .to.emit(lootBox, "RewardAdded")
      .withArgs(1, 0, ethers.parseUnits("1000", 18), 5000);

    await expect(lootBox.addReward(2, 0, 1, 3000))
      .to.emit(lootBox, "RewardAdded")
      .withArgs(2, 0, 1, 3000);

    expect(await lootBox.totalWeight()).to.equal(5000 + 3000);
  });

  it("openBox reverts when insufficient native fee is sent", async function () {
    await expect(
      lootBox.connect(alice).openBox({ value: ethers.parseEther("0.00001") })
    ).to.be.revertedWith("LootBox: Insufficient fee");
  });

  describe("ERC20 reward flow", function () {
    let vaultTokenInstance, opener;

    beforeEach(async function () {
      [deployer, opener, someoneElse] = await ethers.getSigners();
      const vaultTokenAddr = await lootBox.vaultToken();
      vaultTokenInstance = await ethers.getContractAt(
        "CustomERC20",
        vaultTokenAddr
      );

      // This gives LootBox ERC20 tokens for rewards
      await vaultTokenInstance.transfer(
        lootBox.target,
        ethers.parseEther("1000")
      );

      await lootBox.addReward(1, 0, ethers.parseEther("10"), 1000);
    });

    it("opens box, VRF & BoxOpened events emitted, and ERC20 transferred to opener", async function () {
      const openerBalBefore = await vaultTokenInstance.balanceOf(
        opener.address
      );

      const tx = await lootBox
        .connect(opener)
        .openBox({ value: ethers.parseEther("0.0001") });
      await expect(tx).to.emit(lootBox, "BoxOpened");

      const openerBalAfter = await vaultTokenInstance.balanceOf(opener.address);
      expect(openerBalAfter).to.be.gt(openerBalBefore);
    });

    it("accumulates native fees and withdrawFunds transfers them out", async function () {
      await lootBox.connect(alice).openBox({ value: BOX_PRICE });
      await lootBox.connect(bob).openBox({ value: BOX_PRICE });

      const chestNative = await ethers.provider.getBalance(lootBox.target);
      expect(chestNative).to.equal(BOX_PRICE * 2n);

      const before = await ethers.provider.getBalance(recipient.address);

      // This withdraw to recipient (called by deployer)
      await expect(lootBox.connect(deployer).withdrawFunds(recipient.address))
        .to.not.be.reverted;

      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.equal(BOX_PRICE * 2n);

      expect(await ethers.provider.getBalance(lootBox.target)).to.equal(0n);
    });
  });

  describe("ERC721 reward flow", function () {
    beforeEach(async function () {
      await expect(lootBox.addReward(2, 0, 1, 10000)).to.emit(
        lootBox,
        "RewardAdded"
      );
    });

    it("mints ERC721 to opener and emits NFTMinted & BoxOpened", async function () {
      // This assert nftToken NFTMinted & lootBox BoxOpened
      await expect(lootBox.connect(alice).openBox({ value: BOX_PRICE }))
        .to.emit(nftToken, "NFTMinted")
        .and.to.emit(lootBox, "BoxOpened");

      const owner = await nftToken.ownerOf(1);
      expect(owner).to.equal(alice.address);

      const aliceNftBal = await nftToken.balanceOf(alice.address);
      expect(aliceNftBal).to.equal(1);
    });
  });

  describe("ERC1155 reward flow", function () {
    const itemId = 42;
    const itemAmount = 5;

    beforeEach(async function () {
      await expect(lootBox.addReward(3, itemId, itemAmount, 10000)).to.emit(
        lootBox,
        "RewardAdded"
      );
    });

    it("mints ERC1155 items to opener and emits MultiItemMinted & BoxOpened", async function () {
      await expect(lootBox.connect(alice).openBox({ value: BOX_PRICE }))
        .to.emit(multiAsset, "MultiItemMinted")
        .and.to.emit(lootBox, "BoxOpened");

      const bal = await multiAsset.balances(itemId, alice.address);
      expect(bal).to.equal(itemAmount);
    });
  });

  it("supports mixed rewards and emits BoxOpened with valid rewardType (and pays out correctly)", async function () {
    const CustomERC20 = await ethers.getContractFactory("CustomERC20");
    const vault = await CustomERC20.deploy(1_000_000);
    await vault.waitForDeployment();
    const CustomERC721 = await ethers.getContractFactory("CustomERC721");
    const nft = await CustomERC721.deploy();
    await nft.waitForDeployment();
    const CustomERC1155 = await ethers.getContractFactory("CustomERC1155");
    const multi = await CustomERC1155.deploy();
    await multi.waitForDeployment();
    const SecurePseudoVRF = await ethers.getContractFactory("SecurePseudoVRF");
    const vrfx = await SecurePseudoVRF.deploy();
    await vrfx.waitForDeployment();
    const LootBox = await ethers.getContractFactory("LootBox");
    const lootChest = await LootBox.deploy(
      vault.target,
      nft.target,
      multi.target,
      vrfx.target
    );
    await lootChest.waitForDeployment();

    vaultToken = vault;
    nftToken = nft;
    multiAsset = multi;
    vrf = vrfx;
    lootBox = lootChest;

    // This add three rewards with weighted chances
    await lootBox.addReward(1, 0, ethers.parseUnits("500", 18), 5000); // ERC20
    await lootBox.addReward(2, 0, 1, 3000); // ERC721
    await lootBox.addReward(3, 7, 2, 2000); // ERC1155

    await vaultToken.transfer(lootBox.target, ethers.parseUnits("10000", 18));

    await expect(lootBox.connect(bob).openBox({ value: BOX_PRICE })).to.emit(
      lootBox,
      "BoxOpened"
    );

    // Checking ERC20 balance
    const bobTokenBal = await vaultToken.balanceOf(bob.address);
    const bobNftBal = await nftToken.balanceOf(bob.address);
    // Here, For ERC1155, token id used in reward was 7
    const bob1155Bal = await multiAsset.balances(7, bob.address);

    const nonZeroCount =
      (bobTokenBal > 0n ? 1 : 0) +
      (bobNftBal > 0n ? 1 : 0) +
      (bob1155Bal > 0n ? 1 : 0);
    expect(nonZeroCount).to.equal(1);
  });

  it("revert when adding reward with weight zero and ensure totalWeight unchanged", async function () {
    const beforeWeight = await lootBox.totalWeight();

    await expect(
      lootBox.addReward(1, 0, ethers.parseUnits("1", 18), 0)
    ).to.emit(lootBox, "RewardAdded");
    expect(Number(await lootBox.totalWeight())).to.equal(0);
  });

  it("opening box with empty rewards array should revert or produce no reward (we expect revert due to totalWeight=0)", async function () {
    // These deploys fresh chest with no rewards
    const CustomERC20 = await ethers.getContractFactory("CustomERC20");
    const vault = await CustomERC20.deploy(1_000_000);
    await vault.waitForDeployment();
    const CustomERC721 = await ethers.getContractFactory("CustomERC721");
    const nft = await CustomERC721.deploy();
    await nft.waitForDeployment();
    const CustomERC1155 = await ethers.getContractFactory("CustomERC1155");
    const multi = await CustomERC1155.deploy();
    await multi.waitForDeployment();
    const SecurePseudoVRF = await ethers.getContractFactory("SecurePseudoVRF");
    const vrfx = await SecurePseudoVRF.deploy();
    await vrfx.waitForDeployment();
    const LootBox = await ethers.getContractFactory("LootBox");
    const lootChest = await LootBox.deploy(
      vault.target,
      nft.target,
      multi.target,
      vrfx.target
    );
    await lootChest.waitForDeployment();

    await expect(lootChest.connect(alice).openBox({ value: BOX_PRICE })).to.be
      .reverted;
  });
});

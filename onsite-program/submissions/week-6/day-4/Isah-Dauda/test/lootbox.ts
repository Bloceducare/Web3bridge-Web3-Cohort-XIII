import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

// The Pilot
async function deployAll() {
  const [owner, user, other] = await ethers.getSigners();

 
  const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2");
  const vrf = await VRFMock.deploy();
  await vrf.waitForDeployment();


  const ERC20 = await ethers.getContractFactory("ERC20");
  const erc20 = await ERC20.deploy(ethers.parseEther("1000000"));
  await erc20.waitForDeployment();

  const ERC721 = await ethers.getContractFactory("ERC721");
  const erc721 = await ERC721.deploy();
  await erc721.waitForDeployment();

  const ERC1155 = await ethers.getContractFactory("ERC1155");
  const erc1155 = await ERC1155.deploy();
  await erc1155.waitForDeployment();

  
  const keyHash = "0x" + "11".repeat(32);
  const subId = 1n;
  const callbackGasLimit = 500000;
  const fee = ethers.parseEther("0.05");

  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBox.deploy(
    await vrf.getAddress(),
    keyHash,
    subId,
    callbackGasLimit,
    fee
  );
  await lootBox.waitForDeployment();

  return { owner, user, other, vrf, erc20, erc721, erc1155, lootBox, fee };
}

async function addThreeRewards(env: any) {
  const { owner, lootBox, erc20, erc721, erc1155 } = env;

  await erc20.connect(owner).approve(await lootBox.getAddress(), ethers.parseEther("1000"));
  await lootBox.connect(owner).depositERC20(await erc20.getAddress(), ethers.parseEther("1000"));


  await (await erc721.connect(owner)._mint(await lootBox.getAddress(), 1)).wait();


  await (await erc1155.connect(owner).mint(owner.address, 42, 10)).wait();
  await (await erc1155.connect(owner).setApprovalForAll(await lootBox.getAddress(), true)).wait();
  await (await erc1155.connect(owner).safeTransferFrom(owner.address, await lootBox.getAddress(), 42, 5, "0x")).wait();

  
  await (await lootBox.connect(owner).addReward({
    rType: 0, 
    token: await erc20.getAddress(),
    id: 0,
    amount: ethers.parseEther("100"),
    weight: 10
  })).wait();

  await (await lootBox.connect(owner).addReward({
    rType: 1,
    token: await erc721.getAddress(),
    id: 1,
    amount: 1,
    weight: 20
  })).wait();

  await (await lootBox.connect(owner).addReward({
    rType: 2, 
    token: await erc1155.getAddress(),
    id: 42,
    amount: 3,
    weight: 30
  })).wait();
}

async function getRequestIdFromReceipt(lootBox: Contract, receipt: any): Promise<bigint> {
  const iface = lootBox.interface;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (parsed && parsed.name === "LootBoxOpened") {
        return parsed.args.requestId as bigint;
      }
    } catch {}
  }
  throw new Error("LootBoxOpened event not found");
}

describe("LootBox", function () {
  it("deploys and stores params", async function () {
    const env = await deployAll();
    const { lootBox, fee } = env;
    expect(await lootBox.openingFee()).to.equal(fee);
    expect(await lootBox.totalWeight()).to.equal(0n);
    expect(await lootBox.rewardCount()).to.equal(0n);
  });

  it("reverts open when no rewards", async function () {
    const env = await deployAll();
    const { user, lootBox, fee } = env;
    await expect(lootBox.connect(user).openLootBox({ value: fee })).to.be.revertedWithCustomError(
      await ethers.getContractAt("LootBox", await lootBox.getAddress()),
      "NoRewardsConfigured"
    );
  });

  it("adds rewards and tracks weights", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox } = env;
    expect(await lootBox.rewardCount()).to.equal(3n);
    expect(await lootBox.totalWeight()).to.equal(60n);
    const r1 = await lootBox.getReward(0);
    expect(r1.rType).to.equal(0);
  });

  it("removes reward with swap-and-pop", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox, owner } = env;


    await expect(lootBox.connect(owner).removeReward(1)).to.emit(lootBox, "RewardRemoved");
    expect(await lootBox.rewardCount()).to.equal(2n);
    expect(await lootBox.totalWeight()).to.equal(40n);
  });

  it("open + fulfill -> ERC20 path", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox, user, vrf, erc20, fee } = env;

    const balBefore = await erc20.balanceOf(user.address);

    const tx = await lootBox.connect(user).openLootBox({ value: fee });
    const receipt = await tx.wait();
    const requestId = await getRequestIdFromReceipt(lootBox, receipt);


    await (await vrf.fulfill(await lootBox.getAddress(), requestId, [0])).wait();

    const balAfter = await erc20.balanceOf(user.address);
    expect(balAfter - balBefore).to.equal(ethers.parseEther("100"));
  });

  it("open + fulfill -> ERC721 path", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox, user, vrf, erc721, fee } = env;

    const tx = await lootBox.connect(user).openLootBox({ value: fee });
    const receipt = await tx.wait();
    const requestId = await getRequestIdFromReceipt(lootBox, receipt);

    await (await vrf.fulfill(await lootBox.getAddress(), requestId, [10])).wait();

    expect(await erc721.ownerOf(1)).to.equal(user.address);
  });

  it("open + fulfill -> ERC1155 path", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox, user, vrf, erc1155, fee } = env;

    const balBefore = await erc1155.balanceOf(user.address, 42);

    const tx = await lootBox.connect(user).openLootBox({ value: fee });
    const receipt = await tx.wait();
    const requestId = await getRequestIdFromReceipt(lootBox, receipt);

    // 35 => in 30..59
    await (await vrf.fulfill(await lootBox.getAddress(), requestId, [35])).wait();

    const balAfter = await erc1155.balanceOf(user.address, 42);
    expect(balAfter - balBefore).to.equal(3n);
  });

  it("exact fee enforced + updateFee works", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox, owner, user, fee } = env;

    await expect(lootBox.connect(user).openLootBox({ value: fee - 1n })).to.be.revertedWithCustomError(
      lootBox,
      "InvalidFee"
    );

    const newFee = ethers.parseEther("0.1");
    await expect(lootBox.connect(owner).updateFee(newFee)).to.emit(lootBox, "FeeUpdated");
    expect(await lootBox.openingFee()).to.equal(newFee);

    await lootBox.connect(user).openLootBox({ value: newFee });
  });

  it("only coordinator can call rawFulfillRandomWords", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox, user, fee } = env;

    const tx = await lootBox.connect(user).openLootBox({ value: fee });
    const receipt = await tx.wait();
    const requestId = await getRequestIdFromReceipt(lootBox, receipt);

    await expect(
      lootBox.rawFulfillRandomWords(requestId, [0])
    ).to.be.revertedWithCustomError(lootBox, "VRFOnlyCoordinator");
  });

  it("withdrawETH sends balance to owner", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox, owner, user, vrf, fee } = env;

    const tx = await lootBox.connect(user).openLootBox({ value: fee });
    const receipt = await tx.wait();
    const requestId = await getRequestIdFromReceipt(lootBox, receipt);
    await (await vrf.fulfill(await lootBox.getAddress(), requestId, [0])).wait();

    const ownerBefore = await ethers.provider.getBalance(owner.address);
    await (await lootBox.connect(owner).withdrawETH(owner.address, fee)).wait();
    const ownerAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerAfter).to.be.greaterThan(ownerBefore); // account for gas, just ensure it increased
  });

  it("Ownable two-step transfer works and access control enforced", async function () {
    const env = await deployAll();
    const { lootBox, owner, other } = env;

    await expect(lootBox.connect(other).updateFee(1)).to.be.revertedWithCustomError(lootBox, "NotOwner");

    await (await lootBox.connect(owner).transferOwnership(other.address)).wait();
    expect(await lootBox.pendingOwner()).to.equal(other.address);

    await (await lootBox.connect(other).acceptOwnership()).wait();
    expect(await lootBox.owner()).to.equal(other.address);

    await expect(lootBox.connect(owner).updateFee(1)).to.be.revertedWithCustomError(lootBox, "NotOwner");
  });

  it("interfaces & receivers behave", async function () {
    const env = await deployAll();
    const { lootBox } = env;


    const IERC165_ID = "0x01ffc9a7";
    const IERC1155Receiver_ID = "0x4e2312e0";
    expect(await lootBox.supportsInterface(IERC165_ID)).to.equal(true);
    expect(await lootBox.supportsInterface(IERC1155Receiver_ID)).to.equal(true);
  });

  it("invalid removals revert", async function () {
    const env = await deployAll();
    await addThreeRewards(env);
    const { lootBox, owner } = env;
    await expect(lootBox.connect(owner).removeReward(999)).to.be.revertedWithCustomError(lootBox, "InvalidRewardIndex");
  });
});

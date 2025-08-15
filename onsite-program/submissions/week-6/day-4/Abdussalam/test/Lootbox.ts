// test/Lootbox.test.ts
import { ethers } from "hardhat";
import { expect } from "chai";
import { parseEther, ZeroHash } from "ethers";

describe("Lootbox Game", function () {
  it("Should deploy, open lootbox with fee, give one reward, and withdraw funds", async function () {
    const [owner, player] = await ethers.getSigners();

    // 1️⃣ Deploy reward contracts
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const erc20 = await RewardToken.deploy();
    await erc20.waitForDeployment();

    const RewardNFT = await ethers.getContractFactory("RewardNFT");
    const erc721 = await RewardNFT.deploy();
    await erc721.waitForDeployment();

    const RewardMulti = await ethers.getContractFactory("RewardMulti");
    const erc1155 = await RewardMulti.deploy();
    await erc1155.waitForDeployment();

    // 2️⃣ Deploy VRF mock
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfMock = await VRFCoordinatorV2Mock.deploy(
      parseEther("0.1"), // base fee
      1e9 // gas price link
    );
    
    await vrfMock.waitForDeployment();

    // 3️⃣ Create subscription
    const subTx = await vrfMock.createSubscription();
    const subReceipt = await subTx.wait();
    const subId = subReceipt.logs[0].args.subId;
    await vrfMock.fundSubscription(subId, parseEther("10"));

    // 4️⃣ Deploy Lootbox
    const Lootbox = await ethers.getContractFactory("Lootbox");
    const lootbox = await Lootbox.deploy(
      await vrfMock.getAddress(),
      ZeroHash, // mock keyHash
      subId,
      await erc20.getAddress(),
      await erc721.getAddress(),
      await erc1155.getAddress()
    );
    await lootbox.waitForDeployment();

    await vrfMock.addConsumer(subId, await lootbox.getAddress());

    // 5️⃣ Set lootbox price
    const lootboxPrice = parseEther("0.1");
    await lootbox.setLootboxPrice(lootboxPrice);

    // 6️⃣ Try to open lootbox with insufficient ETH (should revert)
    await expect(
      lootbox.connect(player).openLootbox({ value: parseEther("0.01") })
    ).to.be.revertedWith("Not enough ETH to open lootbox");

    // 7️⃣ Open lootbox with correct fee
    const openTx = await lootbox.connect(player).openLootbox({ value: lootboxPrice });
    const openReceipt = await openTx.wait();
    const requestId = openReceipt.logs.find(
      (e: any) => e.fragment && e.fragment.name === "RandomWordsRequested"
    )?.args.requestId;

    // 8️⃣ Fulfill randomness from mock VRF
    await vrfMock.fulfillRandomWords(requestId, await lootbox.getAddress());

    // 9️⃣ Verify only one reward type is given
    const erc20Balance = await erc20.balanceOf(player.address);
    const erc721Balance = await erc721.balanceOf(player.address);
    const erc1155Balance = await erc1155.balanceOf(player.address, 1);

    const rewardTypes = [
      erc20Balance > 0n,
      erc721Balance > 0n,
      erc1155Balance > 0n
    ].filter(Boolean).length;

    expect(rewardTypes).to.equal(1);

    // 🔟 Owner withdraws funds
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    const withdrawTx = await lootbox.withdraw();
    const withdrawReceipt = await withdrawTx.wait();
    const gasUsed = withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;
    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

    expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore - BigInt(gasUsed));
  });
});

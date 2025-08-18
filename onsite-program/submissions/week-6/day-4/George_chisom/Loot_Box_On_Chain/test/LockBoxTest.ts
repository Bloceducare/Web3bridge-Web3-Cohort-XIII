import { expect } from "chai";
import { Signer } from "ethers";
const { ethers } = await network.connect();

describe("LootBox Test", function () {
  it("Should emit the lootBox", async function () {
    const lockBox = await ethers.deployContract("LootBox");

    const [owner, admin]: Signer[] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("LootBoxERC20Token");
    const ERC721 = await ethers.getContractFactory("RewardERC721");
    const ERC1155 = await ethers.getContractFactory("RewardERC1155");
    const token = await ERC20.deploy("LootBox Token", "MTK");

    await ERC721("RewardNFT", "RNFT");

    await expect(lockBox.inc()).to.emit(lockBox, "Increment").withArgs(1n);
  });
});

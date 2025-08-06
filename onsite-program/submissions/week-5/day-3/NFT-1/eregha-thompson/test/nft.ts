import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { HASHIRA__factory } from "../typechain-types";
import { getAddress } from "ethers";

describe("HASHIRA", function () {
  async function hashiraNFT() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const NFT = await hre.ethers.getContractFactory("HASHIRA");
    const nft = await NFT.deploy();

    return { nft, owner, otherAccount };
  }

  describe("deployment", function () {
    it("should test deployment of contract", async function () {
      const { nft, owner, otherAccount } = await loadFixture(hashiraNFT);

      const deployedAddress = await nft.getAddress();
      expect(deployedAddress).to.be.properAddress;
    });
  });

  describe("mint", function () {
    it("should mint nft", async function () {
      const { nft, owner, otherAccount } = await loadFixture(hashiraNFT);

      const address = owner.address;
      const tokenURI =
        "https://gateway.pinata.cloud/ipfs/bafkreibbeepxj3ilizzemsldtalp4zdff55bbxfptugfrgyfygmqgrjrnm";
      const symbol = "HASH";

      await nft.connect(owner).mintNFT(address, tokenURI);

      expect(await nft.ownerOf(1)).to.equal(address);

      expect(await nft.tokenURI(1)).to.equal(tokenURI);
    });
    it("should increase id for mint nft", async function () {
      const { nft, owner, otherAccount } = await loadFixture(hashiraNFT);

      const address = owner.address;
      const tokenURI =
        "https://gateway.pinata.cloud/ipfs/bafkreibbeepxj3ilizzemsldtalp4zdff55bbxfptugfrgyfygmqgrjrnm";
      const symbol = "HASH";

      await nft.connect(owner).mintNFT(address, tokenURI);
      await nft.connect(owner).mintNFT(address, tokenURI);

      expect(await nft.ownerOf(1)).to.equal(address);

      expect(await nft.ownerOf(2)).to.equal(address);
    });
    it("should not mint nft", async function () {
      const { nft, owner, otherAccount } = await loadFixture(hashiraNFT);

      const address = otherAccount.address;
      const tokenURI =
        "https://gateway.pinata.cloud/ipfs/bafkreibbeepxj3ilizzemsldtalp4zdff55bbxfptugfrgyfygmqgrjrnm";
      const otherMinted = nft.connect(otherAccount).mintNFT(address, tokenURI);
      await expect(otherMinted).to.be.revertedWithCustomError(
        nft,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});

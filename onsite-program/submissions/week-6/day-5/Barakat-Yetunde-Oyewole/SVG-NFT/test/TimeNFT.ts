import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TimeNFT", function () {
  async function deployTimeNFTFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const TimeNFT = await hre.ethers.getContractFactory("TimeNFT");
    const timeNFT = await TimeNFT.deploy();

    return { timeNFT, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { timeNFT } = await loadFixture(deployTimeNFTFixture);

      expect(await timeNFT.name()).to.equal("TimeNFT");
      expect(await timeNFT.symbol()).to.equal("TIME");
    });

    it("Should set the right owner", async function () {
      const { timeNFT, owner } = await loadFixture(deployTimeNFTFixture);

      expect(await timeNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint", async function () {
      const { timeNFT, owner, otherAccount } = await loadFixture(deployTimeNFTFixture);

      await expect(timeNFT.mint(otherAccount.address))
        .to.emit(timeNFT, "Transfer")
        .withArgs(hre.ethers.ZeroAddress, otherAccount.address, 0);

      expect(await timeNFT.ownerOf(0)).to.equal(otherAccount.address);
      expect(await timeNFT.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should not allow non-owner to mint", async function () {
      const { timeNFT, otherAccount } = await loadFixture(deployTimeNFTFixture);

      await expect(timeNFT.connect(otherAccount).mint(otherAccount.address))
        .to.be.revertedWithCustomError(timeNFT, "OwnableUnauthorizedAccount");
    });

    it("Should increment token IDs correctly", async function () {
      const { timeNFT, owner, otherAccount } = await loadFixture(deployTimeNFTFixture);

      await timeNFT.mint(owner.address);
      await timeNFT.mint(otherAccount.address);

      expect(await timeNFT.ownerOf(0)).to.equal(owner.address);
      expect(await timeNFT.ownerOf(1)).to.equal(otherAccount.address);
    });
  });

  describe("TokenURI", function () {
    it("Should return valid tokenURI for existing token", async function () {
      const { timeNFT, otherAccount } = await loadFixture(deployTimeNFTFixture);

      await timeNFT.mint(otherAccount.address);
      const tokenURI = await timeNFT.tokenURI(0);

      expect(tokenURI).to.include("data:application/json;base64,");
      
      const base64Data = tokenURI.split("data:application/json;base64,")[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString();
      const metadata = JSON.parse(jsonString);

      expect(metadata.name).to.equal("Time #0");
      expect(metadata.description).to.include("Dynamic time NFT");
      expect(metadata.image).to.include("data:image/svg+xml;base64,");
    });

    it("Should revert for non-existent token", async function () {
      const { timeNFT } = await loadFixture(deployTimeNFTFixture);

      await expect(timeNFT.tokenURI(999))
        .to.be.revertedWithCustomError(timeNFT, "ERC721NonexistentToken");
    });

    it("Should generate different SVG content over time", async function () {
      const { timeNFT, otherAccount } = await loadFixture(deployTimeNFTFixture);

      await timeNFT.mint(otherAccount.address);
      const tokenURI1 = await timeNFT.tokenURI(0);

      await hre.network.provider.send("evm_increaseTime", [60]);
      await hre.network.provider.send("evm_mine");

      const tokenURI2 = await timeNFT.tokenURI(0);

      expect(tokenURI1).to.not.equal(tokenURI2);
    });

    it("Should contain SVG with time elements", async function () {
      const { timeNFT, otherAccount } = await loadFixture(deployTimeNFTFixture);

      await timeNFT.mint(otherAccount.address);
      const tokenURI = await timeNFT.tokenURI(0);

      const base64Data = tokenURI.split("data:application/json;base64,")[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString();
      const metadata = JSON.parse(jsonString);

      const svgBase64 = metadata.image.split("data:image/svg+xml;base64,")[1];
      const svgString = Buffer.from(svgBase64, 'base64').toString();

      expect(svgString).to.include("<svg");
      expect(svgString).to.include("TIME NFT");
      expect(svgString).to.include("Block");
      expect(svgString).to.include(":");
    });
  });
});

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Buffer } from "buffer";

describe("OnChainNFT", function () {
  // Fixture to deploy the OnChainNFT contract
  async function deployOnChainNFTFixture() {
    // Get signers
    const [owner, otherAccount] = await ethers.getSigners();

    // Deploy the contract
    const OnChainNFT = await ethers.getContractFactory("OnChainNFT");
    const onChainNFT = await OnChainNFT.deploy();

    return {
      onChainNFT,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { onChainNFT } = await loadFixture(deployOnChainNFTFixture);

      expect(await onChainNFT.name()).to.equal("TimeOnChainNFT");
      expect(await onChainNFT.symbol()).to.equal("TOC");
    });

    it("Should set the correct owner", async function () {
      const { onChainNFT, owner } = await loadFixture(deployOnChainNFTFixture);

      expect(await onChainNFT.owner()).to.equal(owner.address);
    });
  });

  describe("generateSVG", function () {
    it("Should generate correct SVG with given timestamp", async function () {
      const { onChainNFT } = await loadFixture(deployOnChainNFTFixture);

      // Test timestamp: 17:22:00 UTC, August 15, 2025
      const testTimestamp = 1765992120; // August 15, 2025, 17:22:00 UTC
      const svg = await onChainNFT.generateSVG(testTimestamp);

      // This matches the contract's formatting (see OnChainNFT.sol)
      const expectedSVG = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000000"/><text x="50%" y="50%" font-family="Arial" font-size="48" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">17:22:00</text></svg>`;
      expect(svg).to.equal(expectedSVG);
    });
  });

  describe("svgToImageURI", function () {
    it("Should convert SVG to Base64-encoded image URI", async function () {
      const { onChainNFT } = await loadFixture(deployOnChainNFTFixture);

      const testSVG = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000000"/><text x="50%" y="50%" font-family="Arial" font-size="48" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">17:22:00</text></svg>`;
      const imageURI = await onChainNFT.svgToImageURI(testSVG);

      const expectedBase64 = Buffer.from(testSVG, "utf8").toString("base64");
      const expectedImageURI = `data:image/svg+xml;base64,${expectedBase64}`;
      expect(imageURI).to.equal(expectedImageURI);
    });
  });

  describe("formatTokenURI", function () {
    it("Should format token URI with Base64-encoded JSON", async function () {
      const { onChainNFT } = await loadFixture(deployOnChainNFTFixture);

      const testImageURI = "data:image/svg+xml;base64,TEST_BASE64";
      const tokenURI = await onChainNFT.formatTokenURI(testImageURI);

      // Match contract's JSON formatting (spaces after colons and commas)
      const expectedJSON = '{"name": "TIME ON-CHAINED", "description": "An on-chain NFT displaying the current time based on block.timestamp", "image":"data:image/svg+xml;base64,TEST_BASE64"}';
      const expectedBase64 = Buffer.from(expectedJSON, "utf8").toString("base64");
      const expectedTokenURI = `data:application/json;base64,${expectedBase64}`;
      expect(tokenURI).to.equal(expectedTokenURI);
    });
  });

  describe("mint", function () {
    it("Should mint an NFT and emit Minted event", async function () {
      const { onChainNFT, owner } = await loadFixture(deployOnChainNFTFixture);

      await expect(onChainNFT.connect(owner).mint())
        .to.emit(onChainNFT, "Minted")
        .withArgs(1);

      expect(await onChainNFT.ownerOf(1)).to.equal(owner.address);

      const tokenURI = await onChainNFT.tokenURI(1);
      expect(tokenURI).to.match(/^data:application\/json;base64,/);
    });

    it("Should revert if non-owner tries to mint", async function () {
      const { onChainNFT, otherAccount } = await loadFixture(deployOnChainNFTFixture);

      await expect(
        onChainNFT.connect(otherAccount).mint()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("tokenURI", function () {
    it("Should return dynamic token URI with current block timestamp", async function () {
      const { onChainNFT, owner } = await loadFixture(deployOnChainNFTFixture);

      // Mint a token
      await onChainNFT.connect(owner).mint();

      // Get token URI
      const tokenURI = await onChainNFT.tokenURI(1);

      // Decode token URI
      const json = Buffer.from(tokenURI.split(",")[1], "base64").toString("utf8");
      const metadata = JSON.parse(json);
      expect(metadata.name).to.equal("TIME ON-CHAINED");
      expect(metadata.description).to.equal(
        "An on-chain NFT displaying the current time based on block.timestamp"
      );
      expect(metadata.image).to.match(/^data:image\/svg\+xml;base64,/);

      // Decode SVG and check time format
      const svg = Buffer.from(metadata.image.split(",")[1], "base64").toString("utf8");
      expect(svg).to.match(/<text[^>]*>[0-2][0-9]:[0-5][0-9]:[0-5][0-9]<\/text>/);
    });

    it("Should revert for nonexistent token", async function () {
      const { onChainNFT } = await loadFixture(deployOnChainNFTFixture);

      await expect(
        onChainNFT.tokenURI(1)
      ).to.be.revertedWith("ERC721URIStorage: URI query for nonexistent token");
    });
  });
});
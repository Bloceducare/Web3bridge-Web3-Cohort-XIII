import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("DynamicTimeNFT", () => {
  let nft: Contract;
  let owner: any;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const DynamicTimeNFT = await ethers.getContractFactory("DynamicTimeNFT");
    nft = await DynamicTimeNFT.deploy();
    await nft.waitForDeployment();
  });

  it("should mint an NFT and return a valid tokenURI", async () => {
    const tx = await nft.mint(owner.address);
    await tx.wait();

    const tokenURI: string = await nft.tokenURI(1);
    expect(tokenURI).to.match(/^data:application\/json;base64,/);

    // Decode base64 to verify JSON structure
    const json = Buffer.from(tokenURI.split(',')[1], 'base64').toString();
    const metadata = JSON.parse(json);
    expect(metadata).to.have.property("name").that.includes("Dynamic Time NFT #1");
    expect(metadata).to.have.property("description");
    expect(metadata).to.have.property("image").that.includes("data:image/svg+xml;base64,");

    // Basic SVG content check
    const svg = Buffer.from(metadata.image.split(',')[1], 'base64').toString();
    expect(svg).to.match(/<svg.*<\/svg>/);
    expect(svg).to.match(/Time: \d{2}:\d{2}:\d{2}/);
  });
});
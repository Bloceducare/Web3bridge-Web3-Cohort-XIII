import { expect } from "chai";
import { ethers } from "hardhat";
import { DynamicTimeNFT } from "../typechain-types";

describe("DynamicTimeNFT", function () {

  it("should deploy correctly", async () => {
    const [deployer] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("DynamicTimeNFT");
    const nft = (await NFT.deploy()) as DynamicTimeNFT;
    await nft.waitForDeployment();

    expect(await nft.tokenCounter()).to.equal(0);
  });

  it("should mint a token", async () => {
    const [deployer] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("DynamicTimeNFT");
    const nft = (await NFT.deploy()) as DynamicTimeNFT;
 await nft.waitForDeployment();

    await nft.mint();
    expect(await nft.tokenCounter()).to.equal(1);
    expect(await nft.ownerOf(0)).to.equal(deployer.address);
  });

  it("should return a tokenURI with a valid SVG", async () => {
    const [deployer] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("DynamicTimeNFT");
    const nft = (await NFT.deploy()) as DynamicTimeNFT;
    await nft.waitForDeployment();

    await nft.mint();
    const tokenUri = await nft.tokenURI(0);

   
    expect(tokenUri).to.match(/^data:application\/json;base64,/);

    
    const base64Json = tokenUri.replace(/^data:application\/json;base64,/, "");
    const jsonStr = Buffer.from(base64Json, "base64").toString("utf-8");
    const metadata = JSON.parse(jsonStr);

    expect(metadata.name).to.include("Dynamic Time NFT #0");
    expect(metadata.image).to.match(/^data:image\/svg\+xml;base64,/);

   
    const svgBase64 = metadata.image.replace(/^data:image\/svg\+xml;base64,/, "");
    const svg = Buffer.from(svgBase64, "base64").toString("utf-8");

   
    expect(svg).to.match(/\d{2}:\d{2}:\d{2}/);
  });

  it("should revert tokenURI for nonexistent token", async () => {
    const NFT = await ethers.getContractFactory("DynamicTimeNFT");
    const nft = (await NFT.deploy()) as DynamicTimeNFT;
    await nft.waitForDeployment();

    await expect(nft.tokenURI(0)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );
  });

});

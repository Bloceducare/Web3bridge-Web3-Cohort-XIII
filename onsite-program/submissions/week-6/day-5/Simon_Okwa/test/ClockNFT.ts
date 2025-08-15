
import { expect } from "chai";
import { ethers } from "hardhat";
import { ClockNFT } from "../typechain-types";

describe("ClockNFT", function () {
  let clockNFT: ClockNFT;

  beforeEach(async function () {
    const ClockNFTFactory = await ethers.getContractFactory("ClockNFT");
    clockNFT = await ClockNFTFactory.deploy();
    await clockNFT.waitForDeployment();
  });

  it("Should mint an NFT and emit Minted event", async function () {
    const tx = await clockNFT.mint();
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction receipt is null");
    const event = receipt.logs.find((log: any) => log.fragment?.name === "Minted") as any;
    const tokenId = event?.args?.tokenId;

    expect(tokenId).to.equal(1n);
    expect(await clockNFT.ownerOf(1)).to.equal(await (await ethers.getSigners())[0].getAddress());
  });

  it("Should return a valid dynamic tokenURI with current time", async function () {
    await clockNFT.mint(); // Mint NFT #1
    const tokenURI = await clockNFT.tokenURI(1);

    // Check it's a base64 JSON data URI
    expect(tokenURI).to.match(/^data:application\/json;base64,/);

    // Decode base64 JSON
    const jsonBase64 = tokenURI.split(",")[1];
    const json = Buffer.from(jsonBase64, "base64").toString("utf-8");
    const metadata = JSON.parse(json);

    expect(metadata.name).to.equal("Clock NFT #1");
    expect(metadata.description).to.equal("A dynamic on-chain NFT displaying the current blockchain time");

    // Check image is SVG base64
    expect(metadata.image).to.match(/^data:image\/svg\+xml;base64,/);

    // Decode SVG and check time format (HH:MM:SS)
    const svgBase64 = metadata.image.split(",")[1];
    const svg = Buffer.from(svgBase64, "base64").toString("utf-8");
    const timeMatch = svg.match(/<text x="150" y="180" font-size="50" text-anchor="middle" fill="#d81b60">(\d{2}:\d{2}:\d{2})<\/text>/);
    expect(timeMatch).to.not.be.null;
    const time = timeMatch![1];
    expect(time).to.match(/^\d{2}:\d{2}:\d{2}$/); 
  });

  it("Should revert tokenURI for non-existent token", async function () {
    await expect(clockNFT.tokenURI(999)).to.be.reverted;
  });
});
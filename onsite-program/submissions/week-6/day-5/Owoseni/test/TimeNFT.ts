import { expect } from "chai";
import { ethers } from "hardhat";
import { TimeNFT } from "../typechain-types";

describe("TimeNFT", function () {
  let timeNFT: TimeNFT;
  let owner: any;

  beforeEach(async function () {
    const TimeNFT = await ethers.getContractFactory("TimeNFT");
    [owner] = await ethers.getSigners();
    timeNFT = (await TimeNFT.deploy()) as TimeNFT;
    await timeNFT.deployed();
  });

  it("Should mint token ID 1 to the deployer", async function () {
    expect(await timeNFT.ownerOf(1)).to.equal(owner.address);
  });

  it("Should return a valid tokenURI with SVG", async function () {
    const tokenURI = await timeNFT.tokenURI(1);
    expect(tokenURI).to.match(/^data:application\/json;base64,/);
    const json = Buffer.from(tokenURI.split(",")[1], "base64").toString();
    const metadata = JSON.parse(json);
    expect(metadata.name).to.equal("Dynamic Time NFT #1");
    expect(metadata.description).to.be.a("string");
    expect(metadata.image).to.match(/^data:image\/svg\+xml;base64,/);
    const svg = Buffer.from(metadata.image.split(",")[1], "base64").toString();
    expect(svg).to.match(/Current Time:/);
  });
});
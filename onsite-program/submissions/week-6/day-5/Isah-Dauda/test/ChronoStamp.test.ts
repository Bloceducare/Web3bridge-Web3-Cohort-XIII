import { expect } from "chai";
import { ethers } from "hardhat";


function formatHHMMSSFromTimestamp(ts: number): string {
  const secsInDay = ts % 86400;
  const hours = Math.floor(secsInDay / 3600);
  const minutes = Math.floor((secsInDay % 3600) / 60);
  const seconds = secsInDay % 60;
  const hh = hours < 10 ? `0${hours}` : `${hours}`;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${hh}:${mm}:${ss}`;
}

describe("ChronoStamp ERC721 NFT", function () {
  it("Should mint, return correct balances and ownership", async function () {
    const [deployer, user, operator] = await ethers.getSigners();
    const ChronoStamp = await ethers.getContractFactory("ChronoStamp");
    const chrono = await ChronoStamp.deploy();
    await chrono.waitForDeployment?.();

    
    const tx = await chrono.mintToken(user.address);
    const receipt = await tx.wait();
    const tokenId = 1;

    
    expect(await chrono.balanceOf(user.address)).to.equal(1);
    expect(await chrono.ownerOf(tokenId)).to.equal(user.address);
  });

  it("Should produce dynamic tokenURI with current timestamp", async function () {
    const [deployer, user] = await ethers.getSigners();
    const ChronoStamp = await ethers.getContractFactory("ChronoStamp");
    const chrono = await ChronoStamp.deploy();
    await chrono.waitForDeployment?.();

    await chrono.mintToken(user.address);
    const tokenId = 1;

    const uri1: string = await chrono.tokenURI(tokenId);
    expect(uri1).to.match(/^data:application\/json;base64,/);

    const base64json1 = uri1.split(",")[1];
    const jsonStr1 = Buffer.from(base64json1, "base64").toString("utf8");
    const parsed1 = JSON.parse(jsonStr1);

    expect(parsed1).to.have.property("name");
    expect(parsed1).to.have.property("image");
    expect(parsed1.image).to.match(/^data:image\/svg\+xml;base64,/);

    // Extract SVG and check HH:MM:SS
    const svgBase641 = parsed1.image.split(",")[1];
    const svg1 = Buffer.from(svgBase641, "base64").toString("utf8");
    const match1 = svg1.match(/>(\d{2}:\d{2}:\d{2})</);
    expect(match1).to.not.be.null;

    const block1 = await ethers.provider.getBlock("latest");
    const formattedBlock1 = formatHHMMSSFromTimestamp(block1.timestamp);
    expect(match1![1]).to.equal(formattedBlock1);
  });

  it("Should handle approvals and transfers correctly", async function () {
    const [deployer, user, operator, recipient] = await ethers.getSigners();
    const ChronoStamp = await ethers.getContractFactory("ChronoStamp");
    const chrono = await ChronoStamp.deploy();
    await chrono.waitForDeployment?.();

    await chrono.mintToken(user.address);
    const tokenId = 1;

    
    await chrono.connect(user).approve(operator.address, tokenId);
    expect(await chrono.getApproved(tokenId)).to.equal(operator.address);

    
    await chrono.connect(operator).transferFrom(user.address, recipient.address, tokenId);
    expect(await chrono.ownerOf(tokenId)).to.equal(recipient.address);
    expect(await chrono.balanceOf(recipient.address)).to.equal(1);
    expect(await chrono.balanceOf(user.address)).to.equal(0);
  });

  it("Should support ERC721 and ERC721Metadata interfaces", async function () {
    const [deployer] = await ethers.getSigners();
    const ChronoStamp = await ethers.getContractFactory("ChronoStamp");
    const chrono = await ChronoStamp.deploy();
    await chrono.waitForDeployment?.();

    const ERC721 = "0x80ac58cd";
    const ERC721Metadata = "0x5b5e139f";

    expect(await chrono.supportsInterface(ERC721)).to.equal(true);
    expect(await chrono.supportsInterface(ERC721Metadata)).to.equal(true);
  });
});

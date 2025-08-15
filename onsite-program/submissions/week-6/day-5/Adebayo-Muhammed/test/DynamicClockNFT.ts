import { expect } from "chai";
import { ethers } from "hardhat";

describe("DynamicClockNFT", function () {
  it("Should mint and generate dynamic SVG", async function () {
    const [owner, user] = await ethers.getSigners();
    const ClockNFT = await ethers.getContractFactory("DynamicClockNFT");
    const clock = await ClockNFT.deploy();

    // Test mint
    await clock.connect(user).mint({ value: ethers.parseEther("0.001") });
    expect(await clock.ownerOf(0)).to.equal(user.address);

    // Test dynamic tokenURI
    const tokenURI = await clock.tokenURI(0);
    expect(tokenURI).to.include("data:application/json;base64");
    
    const json = JSON.parse(Buffer.from(tokenURI.split(",")[1], "base64").toString());
    expect(json.name).to.equal("Dynamic Clock #0");
    expect(json.attributes).to.have.length(3);
    
    const svg = Buffer.from(json.image.split(",")[1], "base64").toString();
    expect(svg).to.include("stroke=\"#ff6b6b\""); // Clock hands
    
    console.log("✅ Dynamic Clock NFT working!");
  });
});
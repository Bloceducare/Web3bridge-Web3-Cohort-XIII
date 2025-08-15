import { expect } from "chai";
import { ethers } from "hardhat";

describe("TimeNFT", function () {
  it("Should return a valid tokenURI and update time dynamically", async function () {
    const TimeNFT = await ethers.getContractFactory("TimeNFT");
    const timeNFT = await TimeNFT.deploy();
    await timeNFT.waitForDeployment();

    await timeNFT.mint();

    const uri1 = await timeNFT.tokenURI(1);

    const jsonBase64 = uri1.split(",")[1];
    const json = JSON.parse(Buffer.from(jsonBase64, "base64").toString("utf8"));

    expect(json).to.have.property("image");
    expect(json.image).to.include("data:image/svg+xml;base64,");

    const svgBase64 = json.image.split(",")[1];
    const svg = Buffer.from(svgBase64, "base64").toString("utf8");

    expect(svg).to.include(":");

    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    const uri2 = await timeNFT.tokenURI(1);

    const json2 = JSON.parse(Buffer.from(uri2.split(",")[1], "base64").toString("utf8"));
    const svg2 = Buffer.from(json2.image.split(",")[1], "base64").toString("utf8");

    expect(svg).to.not.equal(svg2);
  });
});

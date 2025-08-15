import { expect } from "chai";
import { ethers } from "hardhat";
import { Base64 } from "js-base64";

describe("DynamicTimeSvgNFT", function () {
  it("should mint and return a valid SVG in tokenURI", async function () {
    const [owner] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("DynamicTimeSvgNFT");
    const nft = await NFT.deploy();

    await nft.mint(owner.address);

    const uri = await nft.tokenURI(1);
    expect(uri).to.include("data:application/json;base64,");

    const json = JSON.parse(Base64.decode(uri.split(",")[1]));
    expect(json).to.have.property("image");

    const svg = Base64.decode(json.image.split(",")[1]);
    expect(svg).to.include("<svg");
    console.log("SVG output:\n", svg);
  });
});

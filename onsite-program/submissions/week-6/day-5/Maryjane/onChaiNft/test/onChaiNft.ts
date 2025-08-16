import { expect } from "chai";
import { ethers } from "hardhat";



describe("OnChaiNft", function () {
  it("Should deploy with correct name and symbol", async function () {
    const OnChaiNft = await ethers.getContractFactory("OnChaiNft");
    const nft = await OnChaiNft.deploy();
    await nft.waitForDeployment();

    expect(await nft.name()).to.equal("SvgNft");
    expect(await nft.symbol()).to.equal("SVGNFT");
  });

  it("Should allow only owner to mint", async function () {
    const [owner, attacker] = await ethers.getSigners();
    const OnChaiNft = await ethers.getContractFactory("OnChaiNft");
    const nft = await OnChaiNft.deploy();
    await nft.waitForDeployment();

    await expect(nft.connect(owner).mint()).to.not.be.reverted;

  
    await expect(nft.connect(attacker).mint())
      .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount")
      .withArgs(attacker.address);
  });

  it("Should mint and return valid tokenURI", async function () {
    const [owner] = await ethers.getSigners();
    const OnChaiNft = await ethers.getContractFactory("OnChaiNft");
    const nft = await OnChaiNft.deploy();
    await nft.waitForDeployment();

    // Mint a token
    await nft.mint();

    const tokenId = 1;
    const tokenUri = await nft.tokenURI(tokenId);

    // tokenURI is base64 JSON
    expect(tokenUri).to.match(/^data:application\/json;base64,/);

    // Decode JSON
    const base64Json = tokenUri.split(",")[1];
    const json = JSON.parse(Buffer.from(base64Json, "base64").toString("utf8"));


    expect(json).to.have.property("name").that.includes("Time #1");
    expect(json).to.have.property("description");
    expect(json).to.have.property("image");

    expect(json.image).to.match(/^data:image\/svg\+xml;base64,/);


    const base64Svg = json.image.split(",")[1];
    const svg = Buffer.from(base64Svg, "base64").toString("utf8");
    expect(svg).to.include("<svg");
    expect(svg).to.include("</svg>");
  });
});

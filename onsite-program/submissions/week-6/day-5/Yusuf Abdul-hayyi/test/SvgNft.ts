import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";

describe("SvgNft", function () {
  async function deploySvgNftFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const SvgNft = await hre.ethers.getContractFactory("SvgNft");
    const svgNft = await SvgNft.deploy();
    await svgNft.waitForDeployment();

    return { svgNft, owner, otherAccount };
  }

  it("Should mint an NFT with the correct SVG data", async function () {
    const { svgNft, owner } = await loadFixture(deploySvgNftFixture);

    const svgData = "<svg><circle cx='50' cy='50' r='40' /></svg>";
    const tx = await svgNft.mint();
    await tx.wait();

    const tokenURI = await svgNft.tokenURI(0);
    expect(tokenURI).to.include("data:image/svg+xml;base64,");
    expect(tokenURI).to.include(Buffer.from(svgData).toString("base64"));
  });

  it("Should revert if non-owner tries to mint", async function () {
    const { svgNft, otherAccount } = await loadFixture(deploySvgNftFixture);

    await expect(svgNft.connect(otherAccount).mint("<svg></svg>"))
      .to.be.revertedWithCustomError(svgNft, "OwnableUnauthorizedAccount")
      .withArgs(otherAccount.address);
  });
});

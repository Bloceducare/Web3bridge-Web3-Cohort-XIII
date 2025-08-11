import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MyNFT", function () {
  async function deployNFTFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy(owner.address);
    await myNFT.waitForDeployment();
    return { myNFT, owner, otherAccount };
  }

  it("Should mint an NFT and set the correct token URI", async function () {
    const { myNFT, owner } = await loadFixture(deployNFTFixture);
    const tokenURI = "ipfs://QmTestURI123";
    await myNFT.safeMint(owner.address, tokenURI);
    expect(await myNFT.tokenURI(0)).to.equal(tokenURI);
    expect(await myNFT.ownerOf(0)).to.equal(owner.address);
    expect(await myNFT.getCurrentTokenId()).to.equal(1);
  });

  it("Should only allow owner to mint", async function () {
    const { myNFT, otherAccount } = await loadFixture(deployNFTFixture);
    const tokenURI = "ipfs://QmTestURI123";
    await expect(
      myNFT.connect(otherAccount).safeMint(otherAccount.address, tokenURI)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
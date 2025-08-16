const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SVGTimeNFT", function () {
  let SVGTimeNFT, svgTimeNFT, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    SVGTimeNFT = await ethers.getContractFactory("SVGTimeNFT");
    svgTimeNFT = await SVGTimeNFT.deploy();
    await svgTimeNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await svgTimeNFT.contractOwner()).to.equal(owner.address);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await svgTimeNFT.name()).to.equal("SVGTimeNFT");
      expect(await svgTimeNFT.symbol()).to.equal("SVGT");
    });

    it("Should start token counter at 1", async function () {
      const tx = await svgTimeNFT.mintTo(owner.address);
      const receipt = await tx.wait();

      // Parse the logs to find the Minted event
      const event = receipt.logs
        .map((log) => {
          try {
            return svgTimeNFT.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "Minted");

      expect(event.args.tokenId).to.equal(1n); // bigint in ethers v6
    });
  });

  describe("Minting", function () {
    it("Should allow only owner to mint", async function () {
      await expect(
        svgTimeNFT.connect(addr1).mintTo(addr1.address)
      ).to.be.revertedWith("only owner");

      await expect(svgTimeNFT.mintTo(addr1.address))
        .to.emit(svgTimeNFT, "Minted")
        .withArgs(addr1.address, 1);
    });

    it("Should increment token IDs on mint", async function () {
      await svgTimeNFT.mintTo(addr1.address);
      await svgTimeNFT.mintTo(addr2.address);

      expect(await svgTimeNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await svgTimeNFT.ownerOf(2)).to.equal(addr2.address);
    });
  });

  describe("tokenURI", function () {
    beforeEach(async function () {
      await svgTimeNFT.mintTo(owner.address);
    });

    it("Should revert for non-existent token", async function () {
      await expect(svgTimeNFT.tokenURI(99)).to.be.revertedWith(
        "token not minted"
      );
    });
  });

  describe("recordView", function () {
    beforeEach(async function () {
      await svgTimeNFT.mintTo(owner.address);
    });

    it("Should revert for non-existent token", async function () {
      await expect(svgTimeNFT.recordView(99)).to.be.revertedWith(
        "token not minted"
      );
    });

    it("Should emit TokenViewed event with timestamp", async function () {
      const blockBefore = await ethers.provider.getBlock("latest");

      await expect(svgTimeNFT.connect(addr1).recordView(1))
        .to.emit(svgTimeNFT, "TokenViewed")
        .withArgs(addr1.address, 1, blockBefore.timestamp + 1); // +1 because next tx block time

      // We can’t assert exact timestamp in all cases, but we can check it’s close
    });
  });

  describe("setDescription", function () {
    it("Should allow only owner to set description", async function () {
      await expect(
        svgTimeNFT.connect(addr1).setDescription("New Desc")
      ).to.be.revertedWith("only owner");

      await svgTimeNFT.setDescription("New Description");
      expect(await svgTimeNFT.description()).to.equal("New Description");
    });
  });
});

import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";
import { Contract, Signer } from "ethers";

describe("DynamicTimeNFT - Basic Tests", () => {
  let nft: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async () => {
    [owner, addr1, addr2] = await hre.ethers.getSigners();
    const DynamicTimeNFT = await hre.ethers.getContractFactory("DynamicTimeNFT");
    nft = await DynamicTimeNFT.deploy();
    await nft.waitForDeployment();
  });

  describe("Deployment", () => {
    it("should deploy with correct name and symbol", async () => {
      expect(await nft.name()).to.equal("DynamicTimeNFT");
      expect(await nft.symbol()).to.equal("DTNFT");
    });

    it("should start with no tokens", async () => {
      // Try to get tokenURI for token 1 (should not exist)
      await expect(nft.tokenURI(1)).to.be.revertedWith("ERC721: URI query for nonexistent token");
    });

    it("should support ERC721 interface", async () => {
      // ERC721 interface ID: 0x80ac58cd
      expect(await nft.supportsInterface("0x80ac58cd")).to.be.true;
    });
  });

  describe("Minting", () => {
    it("should mint an NFT to the specified address", async () => {
      const ownerAddress = await owner.getAddress();
      const tx = await nft.mint(ownerAddress);
      await tx.wait();

      expect(await nft.ownerOf(1)).to.equal(ownerAddress);
      expect(await nft.balanceOf(ownerAddress)).to.equal(1);
    });

    it("should increment token counter with each mint", async () => {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();

      await nft.mint(addr1Address);
      await nft.mint(addr2Address);
      await nft.mint(addr1Address);

      expect(await nft.ownerOf(1)).to.equal(addr1Address);
      expect(await nft.ownerOf(2)).to.equal(addr2Address);
      expect(await nft.ownerOf(3)).to.equal(addr1Address);
      expect(await nft.balanceOf(addr1Address)).to.equal(2);
      expect(await nft.balanceOf(addr2Address)).to.equal(1);
    });

    it("should emit Transfer event on mint", async () => {
      const ownerAddress = await owner.getAddress();
      
      await expect(nft.mint(ownerAddress))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.ZeroAddress, ownerAddress, 1);
    });
  });

  describe("TokenURI Generation", () => {
    beforeEach(async () => {
      const ownerAddress = await owner.getAddress();
      await nft.mint(ownerAddress);
    });

    it("should return a valid data URI for existing token", async () => {
      const tokenURI: string = await nft.tokenURI(1);
      expect(tokenURI).to.match(/^data:application\/json;base64,/);
    });

    it("should revert for non-existent token", async () => {
      await expect(nft.tokenURI(999)).to.be.revertedWith("ERC721: URI query for nonexistent token");
    });

    it("should contain correct metadata structure", async () => {
      const tokenURI: string = await nft.tokenURI(1);
      
      // Decode base64 to verify JSON structure
      const json = Buffer.from(tokenURI.split(',')[1], 'base64').toString();
      const metadata = JSON.parse(json);
      
      expect(metadata).to.have.property("name").that.includes("Dynamic Time NFT #1");
      expect(metadata).to.have.property("description").that.includes("An on-chain NFT that displays the current block timestamp");
      expect(metadata).to.have.property("image").that.includes("data:image/svg+xml;base64,");
    });

    it("should generate valid SVG content", async () => {
      const tokenURI: string = await nft.tokenURI(1);
      const json = Buffer.from(tokenURI.split(',')[1], 'base64').toString();
      const metadata = JSON.parse(json);
      
      // Decode SVG
      const svg = Buffer.from(metadata.image.split(',')[1], 'base64').toString();
      
      expect(svg).to.include('<svg width="300" height="300"');
      expect(svg).to.include('<rect width="300" height="300" fill="black"/>');
      expect(svg).to.include('<text x="150" y="150"');
      expect(svg).to.include('font-family="Arial"');
      expect(svg).to.include('font-size="40"');
      expect(svg).to.include('fill="white"');
      expect(svg).to.include('text-anchor="middle"');
      expect(svg).to.include('</svg>');
    });

    it("should display time in HH:MM:SS format", async () => {
      const tokenURI: string = await nft.tokenURI(1);
      const json = Buffer.from(tokenURI.split(',')[1], 'base64').toString();
      const metadata = JSON.parse(json);
      const svg = Buffer.from(metadata.image.split(',')[1], 'base64').toString();
      
      // Check for time format pattern (HH:MM:SS)
      expect(svg).to.match(/\d{2}:\d{2}:\d{2}/);
    });

    it("should handle different token IDs with same timestamp", async () => {
      const addr1Address = await addr1.getAddress();
      await nft.mint(addr1Address);
      
      const tokenURI1: string = await nft.tokenURI(1);
      const tokenURI2: string = await nft.tokenURI(2);
      
      const json1 = Buffer.from(tokenURI1.split(',')[1], 'base64').toString();
      const json2 = Buffer.from(tokenURI2.split(',')[1], 'base64').toString();
      const metadata1 = JSON.parse(json1);
      const metadata2 = JSON.parse(json2);
      
      // Names should be different
      expect(metadata1.name).to.include("Dynamic Time NFT #1");
      expect(metadata2.name).to.include("Dynamic Time NFT #2");
      
      // But SVG content should be the same (same timestamp)
      expect(metadata1.image).to.equal(metadata2.image);
    });
  });

  describe("ERC721 Standard Compliance", () => {
    beforeEach(async () => {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();
      await nft.mint(ownerAddress);
      await nft.mint(addr1Address);
    });

    it("should support transferFrom", async () => {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();
      
      await nft.transferFrom(ownerAddress, addr1Address, 1);
      expect(await nft.ownerOf(1)).to.equal(addr1Address);
    });

    it("should support safeTransferFrom", async () => {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();
      
      await nft["safeTransferFrom(address,address,uint256)"](ownerAddress, addr1Address, 1);
      expect(await nft.ownerOf(1)).to.equal(addr1Address);
    });

    it("should support approve and getApproved", async () => {
      const addr1Address = await addr1.getAddress();
      
      await nft.approve(addr1Address, 1);
      expect(await nft.getApproved(1)).to.equal(addr1Address);
    });

    it("should support setApprovalForAll and isApprovedForAll", async () => {
      const ownerAddress = await owner.getAddress();
      const addr1Address = await addr1.getAddress();
      
      await nft.setApprovalForAll(addr1Address, true);
      expect(await nft.isApprovedForAll(ownerAddress, addr1Address)).to.be.true;
    });
  });

  describe("Gas Optimization Tests", () => {
    it("should have reasonable gas costs for minting", async () => {
      const ownerAddress = await owner.getAddress();
      const tx = await nft.mint(ownerAddress);
      const receipt = await tx.wait();
      
      // Gas should be reasonable (less than 200k for a simple mint)
      expect(receipt!.gasUsed).to.be.lessThan(200000);
    });

    it("should have reasonable gas costs for tokenURI generation", async () => {
      const ownerAddress = await owner.getAddress();
      await nft.mint(ownerAddress);
      
      // This is a view function, so gas cost is for simulation only
      const gasEstimate = await nft.tokenURI.estimateGas(1);
      expect(gasEstimate).to.be.lessThan(100000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple rapid mints", async () => {
      const ownerAddress = await owner.getAddress();
      
      // Mint multiple tokens rapidly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(nft.mint(ownerAddress));
      }
      
      await Promise.all(promises);
      
      // Check that all tokens were minted correctly
      expect(await nft.balanceOf(ownerAddress)).to.equal(5);
      
      // Check that all tokens have valid URIs
      for (let i = 1; i <= 5; i++) {
        const tokenURI = await nft.tokenURI(i);
        expect(tokenURI).to.match(/^data:application\/json;base64,/);
        expect(await nft.ownerOf(i)).to.equal(ownerAddress);
      }
    });

    it("should revert when querying non-existent token after burn", async () => {
      const ownerAddress = await owner.getAddress();
      await nft.mint(ownerAddress);
      
      // Burn the token (transfer to zero address)
      await nft.transferFrom(ownerAddress, ethers.ZeroAddress, 1);
      
      // Should revert when querying URI for burned token
      await expect(nft.tokenURI(1)).to.be.revertedWith("ERC721: URI query for nonexistent token");
    });
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";
import { CosmicTimeNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("CosmicTimeNFT", function () {
  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      expect(await cosmicTimeNFT.name()).to.equal("Cosmic Time NFT");
      expect(await cosmicTimeNFT.symbol()).to.equal("COSMIC");
    });

    it("Should start with token counter at 1", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      const tokenId = await cosmicTimeNFT.connect(addr1).mint();
      expect(tokenId).to.equal(1);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token and assign it to the caller", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      const mintTx = await cosmicTimeNFT.connect(addr1).mint();
      await mintTx.wait();

      expect(await cosmicTimeNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await cosmicTimeNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should return the correct token ID when minting", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      const tokenId = await cosmicTimeNFT.connect(addr1).mint();
      expect(tokenId).to.equal(1);

      await cosmicTimeNFT.connect(addr1).mint();

      const secondTokenId = await cosmicTimeNFT.connect(addr2).mint();
      expect(secondTokenId).to.equal(2);
    });

    it("Should increment token ID counter correctly", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      await cosmicTimeNFT.connect(addr2).mint();
      
      expect(await cosmicTimeNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await cosmicTimeNFT.ownerOf(2)).to.equal(addr2.address);
    });

    it("Should allow multiple mints by the same user", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      await cosmicTimeNFT.connect(addr1).mint();
      
      expect(await cosmicTimeNFT.balanceOf(addr1.address)).to.equal(2);
      expect(await cosmicTimeNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await cosmicTimeNFT.ownerOf(2)).to.equal(addr1.address);
    });

  it("Should emit Transfer event on mint", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
    const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
    await cosmicTimeNFT.waitForDeployment();

    await expect(cosmicTimeNFT.connect(addr1).mint())
      .to.emit(cosmicTimeNFT, "Transfer")
      .withArgs(ZeroAddress, addr1.address, 1);
  });
});

  describe("Token URI and Metadata", function () {
    it("Should return a valid tokenURI", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      const tokenURI = await cosmicTimeNFT.tokenURI(1);
      
      expect(tokenURI).to.be.a('string');
      expect(tokenURI).to.include('data:application/json;base64,');
    });

    it("Should return tokenURI with correct structure", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      const tokenURI = await cosmicTimeNFT.tokenURI(1);
      
      // Decode the base64 JSON
      const base64Json = tokenURI.split('data:application/json;base64,')[1];
      const jsonString = Buffer.from(base64Json, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      expect(metadata).to.have.property('name');
      expect(metadata).to.have.property('description');
      expect(metadata).to.have.property('image');
      expect(metadata).to.have.property('attributes');
      
      expect(metadata.name).to.equal('Cosmic Time NFT #1');
      expect(metadata.description).to.include('cosmic NFT');
      expect(metadata.image).to.include('data:image/svg+xml;base64,');
    });

    it("Should have time-based attributes", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      const tokenURI = await cosmicTimeNFT.tokenURI(1);
      
      const base64Json = tokenURI.split('data:application/json;base64,')[1];
      const jsonString = Buffer.from(base64Json, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      expect(metadata.attributes).to.be.an('array');
      expect(metadata.attributes.length).to.equal(2);
      
      const lastUpdateAttr = metadata.attributes.find((attr: any) => attr.trait_type === 'Last Update');
      const timestampAttr = metadata.attributes.find((attr: any) => attr.trait_type === 'Timestamp');
      
      expect(lastUpdateAttr).to.exist;
      expect(timestampAttr).to.exist;
      expect(lastUpdateAttr.value).to.match(/^\d{2}:\d{2}:\d{2}$/); // HH:MM:SS format
      expect(timestampAttr.value).to.be.a('number');
    });

    it("Should include cache-busting parameter in image URL", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      const tokenURI = await cosmicTimeNFT.tokenURI(1);
      
      const base64Json = tokenURI.split('data:application/json;base64,')[1];
      const jsonString = Buffer.from(base64Json, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      expect(metadata.image).to.include('?t=');
    });

    it("Should generate different timestamps when called at different times", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      const tokenURI1 = await cosmicTimeNFT.tokenURI(1);
      
      // Mine a new block to advance block.timestamp
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine", []);
      
      const tokenURI2 = await cosmicTimeNFT.tokenURI(1);
      
      // The tokenURIs should be different due to different timestamps
      expect(tokenURI1).to.not.equal(tokenURI2);
    });

    it("Should contain valid SVG in metadata", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      const tokenURI = await cosmicTimeNFT.tokenURI(1);
      
      const base64Json = tokenURI.split('data:application/json;base64,')[1];
      const jsonString = Buffer.from(base64Json, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      // Extract and decode the SVG
      const svgBase64 = metadata.image.split('data:image/svg+xml;base64,')[1].split('?t=')[0];
      const svgString = Buffer.from(svgBase64, 'base64').toString('utf-8');
      
      expect(svgString).to.include('<svg');
      expect(svgString).to.include('viewBox="0 0 400 400"');
      expect(svgString).to.include('COSMIC TIME NFT');
      expect(svgString).to.include('block.timestamp');
    });

    it("Should work for non-existent tokens", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      // Since the require is commented out, it will return a URI even for non-existent tokens
      const tokenURI = await cosmicTimeNFT.tokenURI(999);
      expect(tokenURI).to.be.a('string');
    });
  });

  describe("Time Functionality", function () {
    it("Should reflect current block timestamp", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      
      const currentBlock = await ethers.provider.getBlock("latest");
      const tokenURI = await cosmicTimeNFT.tokenURI(1);
      
      const base64Json = tokenURI.split('data:application/json;base64,')[1];
      const jsonString = Buffer.from(base64Json, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      const timestampAttr = metadata.attributes.find((attr: any) => attr.trait_type === 'Timestamp');
      
      // The timestamp should be close to the current block timestamp
      // (allowing for small differences due to transaction processing time)
      expect(Math.abs(timestampAttr.value - currentBlock.timestamp)).to.be.lessThan(10);
    });

    it("Should format time correctly in HH:MM:SS format", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      const tokenURI = await cosmicTimeNFT.tokenURI(1);
      
      const base64Json = tokenURI.split('data:application/json;base64,')[1];
      const jsonString = Buffer.from(base64Json, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      const lastUpdateAttr = metadata.attributes.find((attr: any) => attr.trait_type === 'Last Update');
      const timeString = lastUpdateAttr.value;
      
      // Should match HH:MM:SS format
      expect(timeString).to.match(/^\d{2}:\d{2}:\d{2}$/);
      
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      expect(hours).to.be.at.least(0).and.at.most(23);
      expect(minutes).to.be.at.least(0).and.at.most(59);
      expect(seconds).to.be.at.least(0).and.at.most(59);
    });
  });

  describe("ERC721 Standard Compliance", function () {
    it("Should support ERC721 interface", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      // ERC721 interface ID
      const ERC721InterfaceId = "0x80ac58cd";
      expect(await cosmicTimeNFT.supportsInterface(ERC721InterfaceId)).to.be.true;
    });

    it("Should allow token transfers", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      await cosmicTimeNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
      
      expect(await cosmicTimeNFT.ownerOf(1)).to.equal(addr2.address);
      expect(await cosmicTimeNFT.balanceOf(addr1.address)).to.equal(0);
      expect(await cosmicTimeNFT.balanceOf(addr2.address)).to.equal(1);
    });

    it("Should allow approvals", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      await cosmicTimeNFT.connect(addr1).approve(addr2.address, 1);
      expect(await cosmicTimeNFT.getApproved(1)).to.equal(addr2.address);
      
      await cosmicTimeNFT.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
      expect(await cosmicTimeNFT.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should clear approvals on transfer", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      await cosmicTimeNFT.connect(addr1).approve(addr2.address, 1);
      await cosmicTimeNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
      
      expect(await cosmicTimeNFT.getApproved(1)).to.equal(ethers.constants.AddressZero);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple tokens correctly", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      await cosmicTimeNFT.connect(addr2).mint();
      
      const tokenURI1 = await cosmicTimeNFT.tokenURI(1);
      const tokenURI2 = await cosmicTimeNFT.tokenURI(2);
      
      // Both should be valid but have different token IDs in the name
      expect(tokenURI1).to.include('base64,');
      expect(tokenURI2).to.include('base64,');
      
      const metadata1 = JSON.parse(Buffer.from(tokenURI1.split('base64,')[1], 'base64').toString());
      const metadata2 = JSON.parse(Buffer.from(tokenURI2.split('base64,')[1], 'base64').toString());
      
      expect(metadata1.name).to.include('#1');
      expect(metadata2.name).to.include('#2');
    });

    it("Should generate consistent URI structure across different tokens", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const CosmicTimeNFTFactory = await ethers.getContractFactory("CosmicTimeNFT");
      const cosmicTimeNFT = await CosmicTimeNFTFactory.deploy();
      await cosmicTimeNFT.waitForDeployment();

      await cosmicTimeNFT.connect(addr1).mint();
      await cosmicTimeNFT.connect(addr1).mint();
      
      const tokenURI1 = await cosmicTimeNFT.tokenURI(1);
      const tokenURI2 = await cosmicTimeNFT.tokenURI(2);
      
      // Both should have the same structure
      expect(tokenURI1.startsWith('data:application/json;base64,')).to.be.true;
      expect(tokenURI2.startsWith('data:application/json;base64,')).to.be.true;
      
      const metadata1 = JSON.parse(Buffer.from(tokenURI1.split('base64,')[1], 'base64').toString());
      const metadata2 = JSON.parse(Buffer.from(tokenURI2.split('base64,')[1], 'base64').toString());
      
      // Same structure, different token IDs
      expect(Object.keys(metadata1)).to.deep.equal(Object.keys(metadata2));
      expect(metadata1.attributes.length).to.equal(metadata2.attributes.length);
    });
  });
});
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { assert } from "console";
import hre from "hardhat";

describe("EShockUNFT", function() {
  async function deployEshockUNFT() {
    const [owner, addr ] = await hre.ethers.getSigners(); 

    const EshockUNFT = await hre.ethers.getContractFactory("EShockUNFT");
    const eShockUNFT = await EshockUNFT.deploy(owner);
    
    return { eShockUNFT, owner, addr }
  }

  describe("Mint", function() {
    it("should mint an nft", async function() {
      const { eShockUNFT, owner } = await loadFixture(deployEshockUNFT); 

      await eShockUNFT.connect(owner).mint(); 

      expect(
        await eShockUNFT.balanceOf(owner)
      ).to.equal(1);
    }); 
  })

  describe("tokenURI", function() {
    it("Should return token URI", async function() {
      const { eShockUNFT, owner } = await loadFixture(deployEshockUNFT); 

      await eShockUNFT.connect(owner).mint();

      const uri1 = await eShockUNFT.connect(owner).tokenURI(0); 
      await time.increase(5); 
      const uri2 = await eShockUNFT.connect(owner).tokenURI(0); 

      expect(uri1).to.not.equal(uri2);
      expect(uri1).to.be.a("string");
    })
  })
})


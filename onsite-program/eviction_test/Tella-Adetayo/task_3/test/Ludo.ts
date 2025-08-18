import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";


describe("Ludo", function() {
  async function deployLudoGame() {
    const [owner, addr1, addr2 ] = await hre.ethers.getSigners(); 

    const LUDO = await hre.ethers.getContractFactory("Ludo"); 
    const ludo = await LUDO.deploy(); 

    return { ludo, owner, addr1, addr2 }; 
  }

  describe("registerPlayer", function() {
    it("should register a user", async function() {
      const {ludo, owner, addr1, addr2} = await loadFixture(deployLudoGame); 

      const name = "Josh"; 
      const score = 81; 
      const color = 1; 

      await ludo.connect(addr1).registerPlayer(name, score, color); 
      const player = await ludo.getPlayers();
      
    

      expect(player[0].name).to.equal(name);
      expect(player[0].score).to.equal(score); 
      expect(player[0].color).to.equal(color);
    })
  }); 
  describe("fundPlayer", function() {
    it("Should reject if the minimum amount is 1", async function() {
      const { ludo, addr1, addr2 } = await loadFixture(deployLudoGame);
      const amount = 1; 
    

      expect(
         ludo.connect(addr1).fundPlayer(addr2.address, 0)
      ).to.be.revertedWithCustomError(ludo,"MINIMUM_AMOUNT_NEEDED_IS_1");
    })
    it("should fund a player", async function() {
      const { ludo, addr1, addr2 } = await loadFixture(deployLudoGame);
      
      await ludo.connect(addr1).fundPlayer(addr2.address, 1); 

      const balance = await ludo.getPlayerBalance(addr2.address); 

      expect(balance).to.equal(1);

    })
  }); 
})


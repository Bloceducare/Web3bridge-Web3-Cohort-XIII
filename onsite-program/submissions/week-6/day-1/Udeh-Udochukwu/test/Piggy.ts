import { GetContractTypeFromFactory } from './../../../../week-3/day-2/Daniel-Akinsanya-Hardhat/typechain-types/common';
import { Piggy } from './../typechain-types/Piggy';
import {
  loadFixture, time
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect,  } from "chai";
import {ethers} from "hardhat";

describe("piggy factory", function () {
 
 async function deployPiggyFactoryFixture() {
   // Get signers
   const [admin, user1, user2] = await ethers.getSigners();

   // Deploy the factory
   const PiggyFactory = await ethers.getContractFactory("Factory");
   const factory = await PiggyFactory.deploy();
       await factory.waitForDeployment();

   return { factory, admin, user1, user2 };
 }

  describe("testing deposit", async function () {
     
      
      it("check deploy", async function(){
        const { factory } = await loadFixture(deployPiggyFactoryFixture);

        expect (factory.target).to.be.properAddress
      })
      
      it("ensure admin is owner", async function () {
        const { factory, admin } = await loadFixture(deployPiggyFactoryFixture);
        
      expect(await factory.admin()).to.equal(admin.address);
      })

    it("create piggy", async function () {

         const currentTime = await time.latest();
         const unlockTime = currentTime + 60;
      const tokenAddress = ethers.ZeroAddress;
      
        const { factory,admin,  user1 } = await loadFixture(deployPiggyFactoryFixture);

        await factory.connect(user1).createPiggyBank(unlockTime, tokenAddress, {value: ethers.parseEther("1")})
       
        const userBanks = await factory.getUserPiggyBanks(user1.address);
        const myBanks = await factory.getMyPiggyBanks();
        const piggy = await ethers.getContractAt("Piggy", userBanks[0]);
        
      expect(userBanks).to.have.lengthOf(1);
      expect(myBanks).to.have.lengthOf(1);

         expect(await piggy.unlockTime()).to.equal(unlockTime);
         expect(await piggy.owner()).to.equal(user1.address);
         expect(await piggy.admin()).to.equal(await factory.admin());
         expect(await piggy.tokenAddress()).to.equal(tokenAddress);
         expect(await piggy.isETH()).to.be.true;

    })
    
  })



});
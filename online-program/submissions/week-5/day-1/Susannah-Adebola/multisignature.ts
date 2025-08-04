import {expect} from "chai";
import hre from "hardhat";

describe("Wallet", function(){
    it ("should give the correct error", async function(){
      const Wallet = await hre.ethers.getContractFactory("Wallet");
      const wallet= await Wallet.deploy()
   
     
    await expect(wallet.revokeConfirmation()).to.be.revertedWith("transaction not confirmed")
}) } )
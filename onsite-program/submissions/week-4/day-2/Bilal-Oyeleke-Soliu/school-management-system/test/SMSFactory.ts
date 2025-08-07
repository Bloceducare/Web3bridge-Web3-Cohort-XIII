import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Test for SMSFactory cntract", () => {
  async function deploySMSFactory() {
    const myContract = await ethers.getContractFactory("SMSFactory");
    const [deployer, addr1] = await ethers.getSigners();
    const deployedContract = await myContract.deploy();
    await deployedContract.waitForDeployment();
    return { deployedContract, deployer, addr1 };
  }

  describe("SMSFactory contract deployment", () => {
    it("Should deploy SMSFactory contract", async () => {
      const { deployedContract, deployer} = await loadFixture(deploySMSFactory);
        expect(deployedContract).to.be.ok;
        expect (await deployedContract.owner()).to.be.equal(deployer.address);
        
        expect((await deployedContract.getSMS()).length).to.be.equal(0);
        await deployedContract.createSMS();
        expect((await deployedContract.getSMS()).length).to.be.equal(1);
    });

    })

});

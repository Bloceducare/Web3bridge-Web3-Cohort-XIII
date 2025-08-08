import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

async function deployFactory() {

  const [owner, user1, user2, user3, user4, user5] = await hre.ethers.getSigners();
  
  const MultiSigFactory = await hre.ethers.getContractFactory("MultiSigFactory");
  const factory = await MultiSigFactory.deploy();
  

  return { factory, owner, user1, user2, user3, user4, user5 };
}

describe("MultiSigFactory Deployment and Testing", function () {
});

describe("Factory Contract Tests", function () {
    it("Should start with zero deployed multisigs", async function () {

      const { factory } = await loadFixture(deployFactory);
      const multiSigsCount = await factory.getDeployedMultiSigsCount();
      expect(multiSigsCount).to.equal(0);
    });

    it("Should create a new multisig successfully", async function () {
      const { factory, user1, user2, user3, user4 } = await loadFixture(deployFactory);

      const owners = [user1.address, user2.address, user3.address, user4.address];
      const requiredSignatures = 3;

      await factory.connect(user1).createMultiSig(owners, requiredSignatures);

      const multiSigsCount = await factory.getDeployedMultiSigsCount();
      expect(multiSigsCount).to.equal(1);
    });

    it("Should store the correct multisig address in deployedMultiSigs array", async function () {
      const { factory, user1, user2, user3, user4 } = await loadFixture(deployFactory);

      const owners = [user1.address, user2.address, user3.address, user4.address];
      const requiredSignatures = 3;

      const tx = await factory.connect(user1).createMultiSig(owners, requiredSignatures);
      
      const receipt = await tx.wait();
      
      const multiSigAddress = await factory.deployedMultiSigs(0);
      
      expect(multiSigAddress).to.not.equal("0x0000000000000000000000000000000000000000");
    });

    
    });

    it("Should return all deployed multisigs", async function () {
      const { factory, user1, user2, user3, user4, user5 } = await loadFixture(deployFactory);

      const owners1 = [user1.address, user2.address, user3.address];
      await factory.connect(user1).createMultiSig(owners1, 3);

      const owners2 = [user2.address, user3.address, user4.address, user5.address];
      await factory.connect(user2).createMultiSig(owners2, 3);


      const deployedMultiSigs = await factory.getDeployedMultiSigs();
      
      expect(deployedMultiSigs.length).to.equal(2);
      
    
      expect(deployedMultiSigs[0]).to.not.equal("0x0000000000000000000000000000000000000000");
      expect(deployedMultiSigs[1]).to.not.equal("0x0000000000000000000000000000000000000000");
    });


  

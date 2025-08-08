import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSig", function () {
  async function deployMultiSigFixture() {
    const [owner, Alice, Bella, Charles, Dave] = await hre.ethers.getSigners();
    const signers = [Alice.address, Bella.address, Charles.address, Dave.address];
    // const MultiSig = await hre.ethers.getContractFactory("MultiSig");
    // const multisig = await MultiSig.deploy(signers, 3);
const multisig = await hre.ethers.deployContract("MultiSig", [signers, 3]);
await owner.sendTransaction({
      to: await multisig.getAddress(),
      value: hre.ethers.parseEther("100")});

    return { multisig, owner, Alice, Bella, Charles, Dave};
  }

  describe("execute Transaction", function(){
    it("Should execute a transaction", async function(){
      const {multisig, owner, Alice, Bella, Charles, Dave} = await loadFixture(deployMultiSigFixture);
      const _amount = hre.ethers.parseEther("10");
      await multisig.submitTransaction(
        Alice.address,
        _amount,
        "0x"
      );
      const txn = await multisig.transactions(0);
      
    })
  })

  
});

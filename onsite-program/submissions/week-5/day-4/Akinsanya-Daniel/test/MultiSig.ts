import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSig", function () {
  async function deployMultiSig(){
     const [owner,otherAccount,thirdAccount,fourthAccount] = await hre.ethers.getSigners();
    const MultiSig = await hre.ethers.getContractFactory("MultiSig")
    const multiSig = await MultiSig.deploy([owner.address,otherAccount.address,thirdAccount.address,fourthAccount.address],3);
      await owner.sendTransaction({
      to: multiSig.target,
      value: hre.ethers.parseEther("9"),
    });
    return{multiSig,owner,otherAccount,thirdAccount,fourthAccount};
   
  }


  describe("Request Transactions",function(){
    it("Should request transactions successfully",async function(){
      const {multiSig,owner,otherAccount} = await loadFixture(deployMultiSig);
      const amount = hre.ethers.parseEther("1");
      await multiSig.connect(owner).requestTransaction(otherAccount.address, amount);

      const [transactionId, recipient, transactionAmount, executed] = await multiSig.getTransaction(0);
      expect(transactionId).to.equal(0);
      expect(recipient).to.equal(otherAccount.address);
      expect(transactionAmount).to.equal(amount);
      expect(executed).to.be.false;
})

  })

  describe("Confirm Transactions", function () {
    it("Should allow owners to confirm and execute a transaction", async function () {
     const { multiSig, owner, otherAccount, thirdAccount, fourthAccount } = await loadFixture(deployMultiSig);
      const amount = hre.ethers.parseEther("1");
      const recipientBalanceBefore = await hre.ethers.provider.getBalance(otherAccount.address);

      await multiSig.connect(owner).requestTransaction(otherAccount.address, amount);
      await multiSig.connect(owner).confirmTransaction(0);
      await multiSig.connect(thirdAccount).confirmTransaction(0);
      await multiSig.connect(fourthAccount).confirmTransaction(0); 

      const [transactionId, recipient, transactionAmount, executed] = await multiSig.getTransaction(0);
      expect(transactionId).to.equal(0);
      expect(recipient).to.equal(otherAccount.address);
      expect(transactionAmount).to.equal(amount);
      expect(executed).to.be.true;
      const recipientBalanceAfter = await hre.ethers.provider.getBalance(otherAccount.address);
      expect(recipientBalanceAfter).to.equal(recipientBalanceBefore + amount);
    });

  
  
  })
});

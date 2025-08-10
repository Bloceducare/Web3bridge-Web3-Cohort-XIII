import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSig", function () {
  async function deployMultiSigFixture() {
    const [owner, Alice, Bella, Charles, Dave] = await hre.ethers.getSigners();
    const signers = [Alice.address, Bella.address, Charles.address, Dave.address];
    const multisig = await hre.ethers.deployContract("MultiSig", [signers, 3]);
    await owner.sendTransaction({
      to: await multisig.getAddress(),
      value: hre.ethers.parseEther("100")});

    return { multisig, owner, Alice, Bella, Charles, Dave};
  }

  describe("deployment", ()=>{
    it("should update owners correctly", async ()=>{
      const{multisig, Alice, Bella, Charles, Dave} = await loadFixture(deployMultiSigFixture);
      expect((await multisig.getOwners())[0]).to.equal(Alice.address);
      expect((await multisig.getOwners())[1]).to.equal(Bella.address);
      expect((await multisig.getOwners())[2]).to.equal(Charles.address);
      expect((await multisig.getOwners())[3]).to.equal(Dave.address);
    })
    it("should initialize transaction count correctly", async ()=>{
      const{multisig} = await loadFixture(deployMultiSigFixture);
      const _txnCount = await multisig.transactionCount();
      expect(_txnCount).to.equal(0n);
    })
    it("should indicate number of required signers", async()=>{
      const{multisig} = await loadFixture(deployMultiSigFixture);
      const _requiredSigners = await multisig.required();
      expect(_requiredSigners).to.equal(3n);
    })
  })

  describe("addTransaction", ()=>{
    it("should add a transaction", async ()=>{
      const{multisig, Bella }= await loadFixture(deployMultiSigFixture);
      const _amount = hre.ethers.parseEther("10");
      await multisig.addTransaction(Bella.address, _amount, "0x");
      const _newTxnCount = await multisig.transactionCount();
      expect(_newTxnCount).to.equal(1n);
    });
    it("should update transactions", async()=>{
      const{multisig, Bella} = await loadFixture(deployMultiSigFixture);
      const _amount = hre.ethers.parseEther("10");
      await multisig.addTransaction(Bella.address, _amount, "0x");
      const _txn = multisig.transactions(0);
      expect(((await _txn).destination)).to.equal(Bella.address);
      expect(((await _txn).value)).to.equal(_amount);
      expect(((await _txn).executed)).to.be.false;
      expect(((await _txn).data)).to.equal("0x");
    });
  })

  describe("Confirmation", ()=>{
    it("should allow a signer confirm a transaction", async ()=>{
      const{multisig, Alice, Charles} = await loadFixture(deployMultiSigFixture);
      const _amount = hre.ethers.parseEther("10");
      await multisig.addTransaction(Charles.address, _amount, "0x");
      expect(await multisig.getConfirmationsCount(0)).to.equal(0);
      expect(await multisig.isOwner(Alice.address)).to.be.true;
      await multisig.connect(Alice).confirmTransaction(0);
      expect(await multisig.getConfirmationsCount(0)).to.equal(1);
    });

    it("should confirm a transaction after owners have signed", async ()=>{
      const {multisig, Alice, Bella, Charles, Dave} = await loadFixture(deployMultiSigFixture);
      const _amount = hre.ethers.parseEther("10");
      await multisig.addTransaction(Alice.address, _amount, "0x");
      expect(await multisig.isOwner(Bella.address)).to.be.true;
      await multisig.connect(Bella).confirmTransaction(0);
      expect(await multisig.getConfirmationsCount(0)).to.equal(1);
      expect(await multisig.isOwner(Charles.address)).to.be.true;
      await multisig.connect(Charles).confirmTransaction(0);
      expect(await multisig.getConfirmationsCount(0)).to.equal(2);
      expect(await multisig.isOwner(Dave.address)).to.be.true;
      await multisig.connect(Dave).confirmTransaction(0);
      expect(await multisig.getConfirmationsCount(0)).to.equal(3);
    });
  });

  describe("Execute Transaction", ()=>{
    it("Should execute a transaction after confirmation", async()=>{
      const{multisig, Alice, Bella, Charles, Dave} = await loadFixture(deployMultiSigFixture);
      const _amount = hre.ethers.parseEther("10");
      await multisig.addTransaction(Alice.address, _amount, "0x");
      await multisig.connect(Bella).confirmTransaction(0);
      await multisig.connect(Charles).confirmTransaction(0);
      await multisig.connect(Dave). confirmTransaction(0);
      expect(await multisig.getConfirmationsCount(0)).to.equal(3);
      await multisig.executeTransaction(0);
      expect((await multisig.transactions(0)).executed).to.be.true;
    })
  })
});

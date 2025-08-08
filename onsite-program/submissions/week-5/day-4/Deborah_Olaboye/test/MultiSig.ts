import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSig", function () {
  async function deployMultiSig() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount1, otherAccount2, otherAccount3 ] = await hre.ethers.getSigners();

    const ownerAddresses = [  owner.address, otherAccount1.address, otherAccount2.address, otherAccount3.address ];
    const requiredConfirmations = 4;

    const MultiSig = await hre.ethers.getContractFactory("MultiSigWallet");
    const multisig = await MultiSig.deploy(ownerAddresses, requiredConfirmations);

    await owner.sendTransaction({
      to: multisig.target,
      value: hre.ethers.parseEther("3"),
    });

    return { multisig, owner, otherAccount1, otherAccount2, otherAccount3 };
  }

  describe("Deployment", function () {
    it("Should get owners", async function () {
      const { multisig, owner, otherAccount1, otherAccount2, otherAccount3 } = await loadFixture(deployMultiSig);

      const expectedOwners = [owner.address, otherAccount1.address, otherAccount2.address, otherAccount3.address];

      expect(await multisig.getOwners()).to.deep.equal(expectedOwners);
    });

    it("Should submit transaction", async function () {
      const { multisig, owner } = await loadFixture(deployMultiSig);

      const to = "0x1Ff9eA9F062C31cfF19Ade558E34894f07Cf7817";
      const value = 10;
      const data = "0x";

      let txIndex = await multisig.getTransactionCount();
      const expectedTxIndex = txIndex ++;

      const tx = await multisig.connect(owner).submitTransaction(to, value, data);

      await expect(tx).to.emit(multisig, "SubmitTransaction").withArgs(owner.address, expectedTxIndex, to, value, data);
    });

    it("Should confirm transaction", async function () {
      const { multisig, owner } = await loadFixture(deployMultiSig);

      const to = "0x1Ff9eA9F062C31cfF19Ade558E34894f07Cf7817";
      const value = 10;
      const data = "0x";

      let txIndex = await multisig.getTransactionCount();
      const expectedTxIndex = txIndex ++;

      const tx = await multisig.connect(owner).submitTransaction(to, value, data);

      const confirmationTx = await multisig.connect(owner).confirmTransaction(expectedTxIndex);

      await expect(confirmationTx).to.emit(multisig, "ConfirmTransaction").withArgs(owner.address, expectedTxIndex);
    });

    it("Should execute transaction", async function () {
      const { multisig, owner, otherAccount1, otherAccount2, otherAccount3 } = await loadFixture(deployMultiSig);

      const to = "0x1Ff9eA9F062C31cfF19Ade558E34894f07Cf7817";
      const value = 10;
      const data = "0x";

      let txIndex = await multisig.getTransactionCount();
      const expectedTxIndex = txIndex ++;

      const tx = await multisig.connect(owner).submitTransaction(to, value, data);
      await multisig.connect(owner).confirmTransaction(expectedTxIndex);

      await multisig.connect(otherAccount1).confirmTransaction(expectedTxIndex);

      await multisig.connect(otherAccount2).confirmTransaction(expectedTxIndex);

      await multisig.connect(otherAccount3).confirmTransaction(expectedTxIndex);
      
      const executionTx = await multisig.connect(owner).executeTransaction(expectedTxIndex);

      await expect(executionTx).to.emit(multisig, "ExecuteTransaction").withArgs(owner.address, expectedTxIndex);
    });

    it("Should revoke transaction", async function () {
      const { multisig, owner, otherAccount1, otherAccount2, otherAccount3 } = await loadFixture(deployMultiSig);

      const to = "0x1Ff9eA9F062C31cfF19Ade558E34894f07Cf7817";
      const value = 10;
      const data = "0x";

      let txIndex = await multisig.getTransactionCount();
      const expectedTxIndex = txIndex ++;

      const tx = await multisig.connect(owner).submitTransaction(to, value, data);
      await multisig.connect(owner).confirmTransaction(expectedTxIndex);

      await multisig.connect(otherAccount1).confirmTransaction(expectedTxIndex);

      await multisig.connect(otherAccount2).confirmTransaction(expectedTxIndex);

      await multisig.connect(otherAccount3).confirmTransaction(expectedTxIndex);
    

      const revokeTx = await multisig.connect(owner).revokeConfirmation(expectedTxIndex);

      await expect(revokeTx).to.emit(multisig, "RevokeConfirmation").withArgs(owner.address, expectedTxIndex);
    });

    it("Should get transaction", async function () {
      const { multisig, owner, otherAccount1 } = await loadFixture(deployMultiSig);

      const to = "0x1Ff9eA9F062C31cfF19Ade558E34894f07Cf7817";
      const value = 10;
      const data = "0x";

      let txIndex = await multisig.getTransactionCount();
      const expectedTxIndex = txIndex ++;

      const tx = await multisig.connect(owner).submitTransaction(to, value, data);
      await multisig.connect(otherAccount1).submitTransaction(to, value, data);

      const confirmationTx = await multisig.connect(owner).confirmTransaction(expectedTxIndex);

      const confirmations = await multisig.getTransactionCount();

      const transaction = await multisig.getTransaction(expectedTxIndex);


      await expect(transaction.to).to.equal(to);
      await expect(transaction.value).to.equal(value);
      await expect(transaction.data).to.equal(data);
      await expect(transaction.executed).to.equal(false);
      await expect(confirmations).to.equal(2);
    });
  });
});

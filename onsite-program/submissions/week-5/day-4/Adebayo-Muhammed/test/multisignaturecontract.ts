import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Multi Signature Test", function () {
  async function deployedMultiSignature() {
    const MultiSignatureContract = await hre.ethers.getContractFactory(
      "MultiSignatureAccount"
    );

    const [owner, owner1, owner2, otherAccount] = await hre.ethers.getSigners();

    const owners = [owner.address, owner1.address, owner2.address];
    const requiredConfirmations = 1;

    const userAcct = otherAccount.address;

    const value = 50;

    const acctData = hre.ethers.randomBytes(9);

    const acctDescription = "Multi Signature Contract";

    const execute = true;

    const transID = 0;

    const multiSignatureContract = await MultiSignatureContract.deploy(
      owners,
      requiredConfirmations
    );

    return {
      multiSignatureContract,
      owners,
      requiredConfirmations,
      userAcct,
      value,
      acctData,
      acctDescription,
      execute,
      owner,
      owner1,
      owner2,
      otherAccount,
      transID,
    };
  }

  describe("Signature Length", function () {
    it("this is to get the Signature length", async function () {
      const {
        multiSignatureContract,
        owner,
        otherAccount,
        value,
        acctData,
        acctDescription,
      } = await loadFixture(deployedMultiSignature);

      await multiSignatureContract
        .connect(owner)
        .submit(otherAccount.address, value, acctData, acctDescription);

      const contractData = multiSignatureContract.AccountData;

      const newContract = contractData.length;

      expect(newContract).to.equals(0);
    });
  });

  describe("Signature Name", function () {
    it("this is to compare the Signature name", async function () {
      const {
        multiSignatureContract,
        owner,
        otherAccount,
        value,
        acctData,
        acctDescription,
      } = await loadFixture(deployedMultiSignature);

      const contractData = await multiSignatureContract
        .connect(owner)
        .submit(otherAccount.address, value, acctData, acctDescription);

      const contractTransData = await multiSignatureContract.view_transaction(
        0
      );

      const newContract = contractTransData.value;

      expect(newContract).to.equals(value);
    });
  });

  describe("Signature approve", function () {
    it("this is to compare the Signature approval", async function () {
      const {
        multiSignatureContract,
        owner,
        otherAccount,
        value,
        acctData,
        acctDescription,
      } = await loadFixture(deployedMultiSignature);

      await multiSignatureContract
        .connect(owner)
        .submit(otherAccount.address, value, acctData, acctDescription);

      const approvalTrack = await multiSignatureContract
        .connect(owner)
        .approve(0);

      const isApproved = await multiSignatureContract.approved(
        0,
        owner.address
      );
      expect(isApproved).to.be.true;

      const approvalCount = await multiSignatureContract.getApprovalCount(0);
      expect(approvalCount).to.equal(1);
    });
  });
})
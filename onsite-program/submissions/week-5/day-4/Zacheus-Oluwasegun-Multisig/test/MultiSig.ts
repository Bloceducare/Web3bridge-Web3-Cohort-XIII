import hre from "hardhat";
import { BytesLike } from "ethers";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { MultiSigWallet } from "../typechain-types";

describe("MultiSig", () => {
  let owners: string[];
  let owner: HardhatEthersSigner;
  let address2: HardhatEthersSigner;
  let address3: HardhatEthersSigner;
  let address4: HardhatEthersSigner;
  let numConfirmationsRequired: number;
  let multiSig: MultiSigWallet;
  let bytesData: BytesLike;

  async function deployMultiSigFixture() {
    const [owner, address2, address3, address4] = await hre.ethers.getSigners();
    const MultiSig = await hre.ethers.getContractFactory("MultiSigWallet");

    const _owners = [owner.address, address2.address, address3.address];
    const _numConfirmationsRequired = 2;
    const multiSig = await MultiSig.deploy(_owners, _numConfirmationsRequired);
    const bytesData = "0x45";

    await owner.sendTransaction({
      to: multiSig.getAddress(),
      value: hre.ethers.parseEther("1.0"),
    });

    return {
      _owners,
      _numConfirmationsRequired,
      multiSig,
      owner,
      address2,
      address3,
      address4,
      bytesData,
    };
  }

  beforeEach("Preset", async () => {
    const fixture = await loadFixture(deployMultiSigFixture);
    owners = fixture._owners;
    owner = fixture.owner;
    address2 = fixture.address2;
    address3 = fixture.address3;
    address4 = fixture.address4;
    numConfirmationsRequired = fixture._numConfirmationsRequired;
    multiSig = fixture.multiSig;
    bytesData = fixture.bytesData;
  });

  describe("Submit Transaction", () => {
    it("should revert if amount more than balance", async () => {
      const amount = hre.ethers.parseEther("1.5");
      expect(
        multiSig.submitTransaction(address3, amount, bytesData)
      ).to.be.revertedWith("Transaction value more than balance");
    });

    it("should revert for non owners", async () => {
      const amount = hre.ethers.parseEther("1");

      expect(
        multiSig
          .connect(address4)
          .submitTransaction(address2, amount, bytesData)
      ).to.be.revertedWith("not owner");
    });

    it("should submit and increment transactions", async () => {
      const amount = hre.ethers.parseEther("0.2");
      const transactionsLength = await multiSig.getTransactionCount();

      expect(
        await multiSig.submitTransaction(address2, amount, bytesData)
      ).to.emit(multiSig, "SubmitTransaction");
      expect(await multiSig.getTransactionCount()).to.be.greaterThan(
        transactionsLength
      );
    });
  });

  describe("Confirm and Revoke Transaction", () => {
    it("make sure only owner, tx exists", async () => {
      const amount = hre.ethers.parseEther("0.2");
      await multiSig.submitTransaction(address2, amount, bytesData);
      const transactionsLength = await multiSig.getTransactionCount();

      expect(
        multiSig
          .connect(address4)
          .confirmTransaction(Number(transactionsLength) - 1)
      ).to.be.revertedWith("not owner");
      expect(
        multiSig.confirmTransaction(Number(transactionsLength) + 1)
      ).to.be.revertedWith("tx does not exist");
    });

    it("confirm trans and update states", async () => {
      const amount = hre.ethers.parseEther("0.2");
      await multiSig.submitTransaction(address2, amount, bytesData);
      const transactionsLength = await multiSig.getTransactionCount();
      await multiSig.confirmTransaction(Number(transactionsLength) - 1);
      const transaction = await multiSig.getTransaction(
        Number(transactionsLength) - 1
      );

      expect(transaction.numConfirmations).to.be.equal(1);

      expect(
        multiSig.confirmTransaction(Number(transactionsLength) - 1)
      ).to.be.revertedWith("tx already confirmed");

      await multiSig
        .connect(address2)
        .confirmTransaction(Number(transactionsLength) - 1);

      expect(transaction.numConfirmations).to.be.equal(1);
    });

    it("should revoke a transaction", async () => {
      
    });
  });

  describe("owners", () => {
    it("should return only owners", async () => {
        expect((await multiSig.getOwners()).length).to.equal(owners.length)
    });
  });
});

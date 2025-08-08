import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSig", function () {
  async function deploy_multi_sig() {
    const [owner, addr1, addr2, addr3, addr4, addr5, otherAccount] = await hre.ethers.getSigners();

    const addresses: [string, string, string] = [owner.address, addr1.address, addr2.address];
      const signers = 3;

    const MultiSig = await hre.ethers.getContractFactory("MultiSig");
    const multisig = await MultiSig.deploy(addresses, signers);

    return { multisig, owner, addr1, addr2, addr3, addr4, addr5, addresses, signers, otherAccount };
  }

  describe("Deployment", function () {
    it("Should return the addresses passed to it", async function () {
      const { multisig, addresses, signers } = await loadFixture(deploy_multi_sig);

      const getAddress = await multisig.getAddresses();
      const getSigners = await multisig.getSigners();

      expect(getAddress).to.deep.equal(addresses);
      expect(getSigners).to.equal(signers);
    });
  });

  describe("Helper Functions", function() {
    it("Should check if the owner is a signer", async function() {
      const { multisig, owner } = await loadFixture(deploy_multi_sig);
      const isOwner = await multisig.isOwnerIn(owner.address);
      expect(isOwner).to.be.equal(true);
    });

    it("Should check if a non-owner is not a signer", async function () {
      const { multisig, otherAccount } = await loadFixture(deploy_multi_sig);
      const isOwner = await multisig.isOwnerIn(otherAccount.address);
      expect(isOwner).to.equal(false);
    });

    it("Should revert with NOT_AN_OWNER if called by non-owner", async function () {
      const { multisig, otherAccount, addr1 } = await loadFixture(deploy_multi_sig);
      const amount = hre.ethers.parseEther("2");
      const data = "0x";

      await expect(
        multisig.connect(otherAccount).submitTransaction(addr1.address, amount, data)
      ).to.be.revertedWithCustomError(multisig, "NOT_AN_OWNER");
    });

    it("Should revert with NOT_A_VALID_ADDRESS if to is address(0)", async function () {
      const { multisig, owner } = await loadFixture(deploy_multi_sig);
      const amount = hre.ethers.parseEther("2");
      const data = "0x";

      await expect(
        multisig.connect(owner).submitTransaction(hre.ethers.ZeroAddress, amount, data)
      ).to.be.revertedWithCustomError(multisig, "NOT_A_VALID_ADDRESS");
    });

    it("Should revert with NOT_A_VALID_VALUE if value is 0", async function () {
      const { multisig, owner, addr1 } = await loadFixture(deploy_multi_sig);
      const amount = 0;
      const data = "0x";

      await expect(
        multisig.connect(owner).submitTransaction(addr1.address, amount, data)
      ).to.be.revertedWithCustomError(multisig, "NOT_A_VALID_VALUE");
    });

    // it("Should submit a transaction successfully", async function () {
    //   const { multisig, owner, otherAccount } = await loadFixture(deploy_multi_sig);
    //   const amount = hre.ethers.parseEther("2");
    //   const data = "0x";

    //   await multisig.connect(owner).submitTransaction(otherAccount.address, amount, data);

    //   const [to, value, txData, executed, signatureCount] = await multisig.getTransaction(0);
    //   expect(to).to.equal(otherAccount.address);
    //   expect(value).to.equal(amount);
    //   expect(txData).to.equal(data);
    //   expect(executed).to.equal(false);
    //   expect(signatureCount).to.equal(3);
    // });
  });

  describe("Signing & Execution", function () {
    // it("Should revert if an owner tries to sign the same transaction twice", async function () {
    //   const { multisig, owner, addr1 } = await loadFixture(deploy_multi_sig);

    //   const amount = hre.ethers.parseEther("1");
    //   const data = "0x";

    //   await multisig.connect(owner).submitTransaction(addr1.address, amount, data);

    //   await multisig.connect(owner).signTransaction(0);

    //   await expect(
    //     multisig.connect(owner).signTransaction(0)
    //   ).to.be.revertedWith("Transaction already signed by this owner");
    // });

    it("Should revert with INVALID_TRANSACTION_ID when signing a non-existent tx", async function () {
      const { multisig, owner } = await loadFixture(deploy_multi_sig);

      await expect(
        multisig.connect(owner).signTransaction(0)
      ).to.be.revertedWithCustomError(multisig, "INVALID_TRANSACTION_ID");

      await expect(
        multisig.connect(owner).signTransaction(5)
      ).to.be.revertedWithCustomError(multisig, "INVALID_TRANSACTION_ID");
    });
  });
});

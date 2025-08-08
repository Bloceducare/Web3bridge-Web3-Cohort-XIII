import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Multisig", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultisigFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, owner1, owner2, owner3, otherAccount] =
      await hre.ethers.getSigners();

    const Multisig = await hre.ethers.getContractFactory("Multisig");
    const multisig = await Multisig.deploy(
      [owner.address, owner1.address, owner2.address],
      3,
      owner,
    );

    return { multisig, owner, owner1, owner2, owner3, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async () => {
      const { multisig, owner, owner1, owner2 } = await loadFixture(
        deployMultisigFixture,
      );

      const confirmations = "3";
      const owners = [owner.address, owner1.address, owner2.address];

      expect(await multisig.get_owners()).to.deep.equal(owners);
      expect(await multisig.get_confirmation()).to.equal(confirmations);
    });

    it("Should fail if one of the owner address is wrong", async () => {
      const { multisig, owner, owner1, otherAccount } = await loadFixture(
        deployMultisigFixture,
      );

      const owners = [owner.address, owner1.address, otherAccount.address];

      expect(await multisig.get_owners()).to.not.deep.equal(owners);
    });
  });

  describe("Execute Transation", function () {
    describe("Validations", function () {
      it("Should get number of confirmations", async () => {
        const { multisig } = await loadFixture(deployMultisigFixture);

        const confirmations = "3";

        expect(await multisig.get_confirmation()).to.equal(confirmations);
      });

      it("Should fail if not owner try to confirm a transaction", async () => {
        const { multisig, owner } = await loadFixture(deployMultisigFixture);

        const id = 0;

        await expect(
          multisig.connect(owner).confirmTransaction(id),
        ).to.be.revertedWith("Only Owner can confirm a transaction");
      });

      it("Should fail it another address tries to add transaction to the list", async () => {
        const { multisig, otherAccount } = await loadFixture(
          deployMultisigFixture,
        );

        const _amount = hre.ethers.parseEther("1");

        await expect(
          multisig.submitTransaction(otherAccount.address, _amount),
        ).to.be.revertedWith("Only Owner can confirm a transaction");
      });

      it("Should get confirmation count", async () => {
        const { multisig } = await loadFixture(deployMultisigFixture);

        await expect(multisig.getConfirmationsCount(0)).to.not.be.reverted;
      });

      it("Should get is confirmed", async () => {
        const { multisig } = await loadFixture(deployMultisigFixture);

        expect(await multisig.isConfirmed(0)).to.not.be.reverted;
      });
    });

    it("Should submit a transaction", async () => {
      const { multisig, owner, owner1, owner2, otherAccount } =
        await loadFixture(deployMultisigFixture);

      const _amount = hre.ethers.parseEther("2");

      await expect(
        multisig
          .connect(owner)
          .submitTransaction(otherAccount.address, _amount),
      ).to.not.be.reverted;
    });

    describe("Events", function () {});

    describe("Transfers", function () {});
  });
});

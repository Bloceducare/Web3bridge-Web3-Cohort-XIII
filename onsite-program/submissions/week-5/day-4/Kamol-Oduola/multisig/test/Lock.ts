import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSigWallet", function () {
  async function deployMultisigFixture() {
    const [owner1, owner2, owner3, owner4, recipient] =
      await hre.ethers.getSigners();

    const requiredConfirmations = 2;
    const owners = [owner1.address, owner2.address, owner3.address];

    const wallet = await hre.ethers.deployContract("MultiSigWallet", [
      owners,
      requiredConfirmations,
    ]);

    return { wallet, owner1, owner2, owner3, owner4, recipient };
  }

  describe("Deployment", function () {
    it("Should deploy with the correct owners and required confirmations", async function () {
      const { wallet, owner1, owner2, owner3 } = await loadFixture(
        deployMultisigFixture
      );

      expect(await wallet.isOwner(owner1.address)).to.be.true;
      expect(await wallet.isOwner(owner2.address)).to.be.true;
      expect(await wallet.isOwner(owner3.address)).to.be.true;
      expect(await wallet.requiredConfirmations()).to.equal(2);
    });
  });
});

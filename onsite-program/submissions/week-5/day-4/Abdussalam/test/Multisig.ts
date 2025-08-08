
import { expect } from "chai";
import { ethers } from "hardhat";
import { Multisig } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Multisig Wallet", function () {
  // Deployment fixture
  async function deployMultisig() {
    // Get at least 3 signers for the owners requirement
    const [owner1, owner2, owner3, owner4, nonOwner, recipient] =
      await ethers.getSigners();

    // Deploy the contract with 3 owners and 3 required signatures
    const MultisigFactory = await ethers.getContractFactory("Multisig");
    const owners = [owner1.address, owner2.address, owner3.address];
    const requiredSignatures = 3;

    const multisig = await MultisigFactory.deploy(owners, requiredSignatures);
    await multisig.waitForDeployment();

    return {
      multisig,
      owner1,owner2,owner3, owner4,nonOwner,recipient,owners,requiredSignatures,
};
  }

  describe("Submission of Transaction", function () {
    it("Should submit the transaction successfully", async function () {
      const { multisig, owner1, recipient } = await loadFixture(deployMultisig);

      const to = recipient.address;
      const value = ethers.parseEther("1.0");
      const data = "0x";

      // Submit transaction
      const tx = await multisig
        .connect(owner1)
        .submitTransaction(to, value, data);
      await tx.wait();

      // Check transaction count (make sure to await the async call)
      const transactionCount = await multisig.getTransactionCount();
      expect(transactionCount).to.equal(1);
    });

    it("Should revert when called by non-owner", async function () {
      const { multisig, nonOwner, recipient } = await loadFixture(
        deployMultisig
      );

      const to = recipient.address;
      const value = ethers.parseEther("1.0");
      const data = "0x";

      // Should revert with "Not an owner!"
      await expect(
        multisig.connect(nonOwner).submitTransaction(to, value, data)
      ).to.be.revertedWith("Not an owner!");
    });

    it("Should revert when destination address is zero", async function () {
      const { multisig, owner1 } = await loadFixture(deployMultisig);

      const to = ethers.ZeroAddress; // address(0)
      const value = ethers.parseEther("1.0");
      const data = "0x";

      // Should revert with "Invalid destination address"
      await expect(
        multisig.connect(owner1).submitTransaction(to, value, data)
      ).to.be.revertedWith("Invalid destination address");
    });

    it("Should accept zero value transactions", async function () {
      const { multisig, owner1, recipient } = await loadFixture(deployMultisig);

      const to = recipient.address;
      const value = 0; // Zero value
      const data = ethers.hexlify(ethers.toUtf8Bytes("contract call"));

      // Should not revert
      await expect(multisig.connect(owner1).submitTransaction(to, value, data))
        .to.not.be.reverted;
    });

    it("Should emit transactionCreated event with correct parameters", async function () {
      const { multisig, owner2, recipient } = await loadFixture(deployMultisig);

      const to = recipient.address;
      const value = ethers.parseEther("0.5");
      const data = ethers.hexlify(ethers.toUtf8Bytes("test data"));

      // Check that the event is emitted with correct parameters
      await expect(multisig.connect(owner2).submitTransaction(to, value, data))
        .to.emit(multisig, "transactionCreated")
        .withArgs(0, to, value, data); // First transaction has ID 0
    });

    it("Should assign sequential transaction IDs", async function () {
      const { multisig, owner1, owner2, recipient } = await loadFixture(
        deployMultisig
      );

      const to = recipient.address;
      const value = ethers.parseEther("1.0");
      const data = "0x";

      // Submit first transaction - should have ID 0
      await expect(multisig.connect(owner1).submitTransaction(to, value, data))
        .to.emit(multisig, "transactionCreated")
        .withArgs(0, to, value, data);

      // Submit second transaction - should have ID 1
      await expect(multisig.connect(owner2).submitTransaction(to, value, data))
        .to.emit(multisig, "transactionCreated")
        .withArgs(1, to, value, data);

      // Verify both transactions were added
      const transactionCount = await multisig.getTransactionCount();
      expect(transactionCount).to.equal(2);
    });
  });
});
  
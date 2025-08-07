import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiSig", function () {
  async function deployMultiSigFixture() {
    const [deployer, owner1, owner2, owner3, owner4, nonOwner, recipient] =
      await hre.ethers.getSigners();
    const required = 3;

    const MultiSig = await hre.ethers.getContractFactory("MultiSig");
    const multisig = await MultiSig.deploy(
      [owner1.address, owner2.address, owner3.address, owner4.address],
      required
    );

    return {
      multisig,
      deployer,
      owner1,
      owner2,
      owner3,
      owner4,
      nonOwner,
      recipient,
      required,
    };
  }

  describe("Submit", function () {
    it("Should store a new transaction", async function () {
      const { multisig, owner1, owner2 } = await loadFixture(deployMultiSigFixture);

      const to = owner2.address;
      const value = hre.ethers.parseEther("1");
      const data = hre.ethers.hexlify(hre.ethers.toUtf8Bytes("food"));

      await multisig.connect(owner1).submit(to, value, data);

      const txn = await multisig.getTransaction(0);
      expect(txn.to).to.equal(to);
      expect(txn.value).to.equal(value);
      expect(txn.data).to.equal(data);
      expect(txn.executed).to.be.false;
    });

    it("Should revert if a non-owner tries to submit", async function () {
      const { multisig, nonOwner, owner1 } = await loadFixture(deployMultiSigFixture);

      const to = owner1.address;
      const value = hre.ethers.parseEther("1");
      const data = "0x";

      await expect(
        multisig.connect(nonOwner).submit(to, value, data)
      ).to.be.revertedWith("Not Owner");
    });
  });

  describe("Approve", function () {
    it("Should allow owners to approve and count approvals", async function () {
      const { multisig, owner1, owner2, owner3, owner4, recipient } =
        await loadFixture(deployMultiSigFixture);

      const value = hre.ethers.parseEther("0.5");
      await multisig.connect(owner1).submit(recipient.address, value, "0x");

      await multisig.connect(owner1).approve(0);
      await multisig.connect(owner2).approve(0);
      await multisig.connect(owner3).approve(0);

      await expect(multisig.connect(owner4).execute(0)).to.not.be.reverted;
    });

    it("Should revert if already approved by the same owner", async function () {
      const { multisig, owner1, recipient } = await loadFixture(deployMultiSigFixture);

      await multisig.connect(owner1).submit(recipient.address, 0, "0x");
      await multisig.connect(owner1).approve(0);

      await expect(multisig.connect(owner1).approve(0)).to.be.revertedWith(
        "Tx already approved"
      );
    });
  });

  describe("Execute", function () {
    it("Should execute when enough approvals are present", async function () {
      const { multisig, owner1, owner2, owner3, recipient } = await loadFixture(deployMultiSigFixture);

      // Fund the contract so it can send ETH
      await owner1.sendTransaction({
        to: await multisig.getAddress(),
        value: hre.ethers.parseEther("1"),
      });

      const value = hre.ethers.parseEther("0.5");
      await multisig.connect(owner1).submit(recipient.address, value, "0x");

      await multisig.connect(owner1).approve(0);
      await multisig.connect(owner2).approve(0);
      await multisig.connect(owner3).approve(0);

      const balanceBefore = await hre.ethers.provider.getBalance(recipient.address);

      await multisig.connect(owner2).execute(0);

      const balanceAfter = await hre.ethers.provider.getBalance(recipient.address);

      expect(balanceAfter - balanceBefore).to.equal(value);
    });

    it("Should revert if approvals are less than required", async function () {
      const { multisig, owner1, recipient } = await loadFixture(deployMultiSigFixture);

      await multisig.connect(owner1).submit(recipient.address, 0, "0x");
      await multisig.connect(owner1).approve(0);

      await expect(multisig.connect(owner1).execute(0)).to.be.revertedWithCustomError(
        multisig,
        "APPROVAL_LESS_THAN_REQUIRED"
      );
    });
  });

  describe("Revoke", function () {
    it("Should revoke an approval", async function () {
      const { multisig, owner1, owner2, recipient } = await loadFixture(deployMultiSigFixture);

      await multisig.connect(owner1).submit(recipient.address, 0, "0x");
      await multisig.connect(owner1).approve(0);
      await multisig.connect(owner2).approve(0);

      await multisig.connect(owner2).revoke(0);

      // Now approvals < required, so execution should fail
      await expect(multisig.connect(owner1).execute(0)).to.be.revertedWithCustomError(
        multisig,
        "APPROVAL_LESS_THAN_REQUIRED"
      );
    });

    it("Should revert if trying to revoke without approving first", async function () {
      const { multisig, owner1, recipient } = await loadFixture(deployMultiSigFixture);

      await multisig.connect(owner1).submit(recipient.address, 0, "0x");

      await expect(multisig.connect(owner1).revoke(0)).to.be.revertedWithCustomError(
        multisig,
        "TX_NOT_APPROVED"
      );
    });
  });
});

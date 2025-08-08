import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { expect } from "chai";

describe("MultiSigFactory", () => {
  async function deployMultiSigFactory() {
    const [owner, address2, address3] = await hre.ethers.getSigners();
    const MultiSigFactory = await hre.ethers.getContractFactory(
      "MultiSigFactory"
    );
    const multiSigFactory = await MultiSigFactory.deploy();
    const owners = [owner.address, address2.address, address3.address];
    const minNumberOfConfirmations = 2;

    return { owner, multiSigFactory, owners, minNumberOfConfirmations };
  }

  describe("Testing functions", () => {
    it("should create a new multisig wallet", async () => {
      const { multiSigFactory, owners, minNumberOfConfirmations } =
        await loadFixture(deployMultiSigFactory);
      const initalLength = await multiSigFactory.getMultiSigWalletsLength();
      await multiSigFactory.createMultiSigWallet(
        owners,
        minNumberOfConfirmations
      );

      expect(await multiSigFactory.getMultiSigWalletsLength()).to.equal(
        Number(initalLength) + 1
      );
      expect(await multiSigFactory.createMultiSigWallet(
        owners,
        minNumberOfConfirmations
      )).to.emit(multiSigFactory, "MultiSigCreated")
    });

    it("should revert for index higher than length", async () => {
      const { multiSigFactory, owners, minNumberOfConfirmations } =
        await loadFixture(deployMultiSigFactory);
      await multiSigFactory.createMultiSigWallet(
        owners,
        minNumberOfConfirmations
      );
      const length = await multiSigFactory.getMultiSigWalletsLength();

      expect(
        multiSigFactory.getMultiSigWallet(Number(length) + 1)
      ).to.be.revertedWith("Index is not found");
    });

    it("should check if contract address is saved", async () => {
      const { multiSigFactory, owners, minNumberOfConfirmations, owner } =
        await loadFixture(deployMultiSigFactory);
      await multiSigFactory.createMultiSigWallet(
        owners,
        minNumberOfConfirmations
      );
      const length = await multiSigFactory.getMultiSigWalletsLength();

      expect(
        typeof (await multiSigFactory.getMultiSigWallet(Number(length) - 1))
      ).to.be.equal(typeof owner.address);
    });
  });
});

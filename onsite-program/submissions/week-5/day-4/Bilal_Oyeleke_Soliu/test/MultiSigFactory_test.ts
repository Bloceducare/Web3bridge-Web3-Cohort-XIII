import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultisigFactory", () => {
  async function deployFactory() {
    const [owner1, owner2, owner3] = await ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const requiredSignatures = 2;

    const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
    const deployedFactory = await MultisigFactory.deploy();

    return { deployedFactory, owner1, owner2, owner3, owners, requiredSignatures };
  }

  describe("Create Wallet", () => {
    it("Should create a new multisig wallet", async () => {
      const { deployedFactory, owners, requiredSignatures } = await loadFixture(deployFactory);

      const tx = await deployedFactory.createWallet(owners, requiredSignatures);
      const receipt = await tx.wait();

      const walletAddress = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "WalletCreated"
      ).args.walletAddress;

      expect(walletAddress).to.properAddress;

      const allWallets = await deployedFactory.getAllWallets();
      expect(allWallets).to.include(walletAddress);
    });

    it("Created wallet should have correct config", async () => {
      const { deployedFactory, owners, requiredSignatures } = await loadFixture(deployFactory);

      const tx = await deployedFactory.createWallet(owners, requiredSignatures);
      const receipt = await tx.wait();
      const walletAddress = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "WalletCreated"
      ).args.walletAddress;

      const Multisig = await ethers.getContractFactory("Multisig");
      const wallet = Multisig.attach(walletAddress);

      expect(await wallet.getOwners()).to.deep.equal(owners);
      expect(await wallet.getRequiredSignatures()).to.equal(requiredSignatures);
    });
  });
});

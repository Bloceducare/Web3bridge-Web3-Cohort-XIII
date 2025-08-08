import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Mulisig", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultisig() {
    // Contracts are deployed using the first signer/account by default
    const [owner, firstAddress, secondAddress, thirdAddress] =
      await hre.ethers.getSigners();
    const first = firstAddress.address;
    const second = secondAddress.address;
    const third = thirdAddress.address;

    const multisig = await hre.ethers.getContractFactory("multisig");
    // const transfer =hre.ethers.parseEther("0.5");
    const multi = await multisig.deploy([first, second]);

    return { multi, owner, firstAddress, secondAddress, thirdAddress };
  }

  describe("Deployment", function () {
    it("Should set the right deployment address", async function () {
      const { multi, owner } = await loadFixture(deployMultisig);

      expect(await multi.getAddress()).to.be.properAddress;
    });
  });
  describe("create transaction", function () {
    it("should create a transaction", async function () {
      const { multi, owner, firstAddress, secondAddress, thirdAddress } =
        await loadFixture(deployMultisig);

      const contractAddress = await multi.getAddress();
      const amount = hre.ethers.parseEther("2");
      owner.sendTransaction({
        to: contractAddress,
        value: amount,
      });
      const transferAmount = hre.ethers.parseEther("0.5");
      await multi.createTransaction(
        await thirdAddress.getAddress(),
        transferAmount
      );
      const allTransactions = await multi.getTransaction();
      expect(allTransactions.length).to.equal(1);
    });
  });
});

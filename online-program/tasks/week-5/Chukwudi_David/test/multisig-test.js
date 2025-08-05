const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("MultiSig", function () {

  async function deployMultisig() {

    const [owner, addr2, addr3, notOwner] = await ethers.getSigners();

    const owners = [owner.address, addr2.address, addr3.address];

    const Multisig = await ethers.getContractFactory("MultiSigWallet");
    const multisig = await Multisig.deploy(owners, 2);

    return { multisig, owners };
  }

  describe("Deployment", function () {
    it("Should set the right owners", async function () {
      const { multisig, owners } = await loadFixture(deployMultisig);

      expect(await multisig.isOwner(owners[0])).to.equal(true);
      expect(await multisig.isOwner(owners[1])).to.equal(true);
      expect(await multisig.isOwner(owners[2])).to.equal(true);

    });

    it("Should set the right number of confirmations", async function () {
      const { multisig } = await loadFixture(deployMultisig);

      expect(await multisig.required()).to.equal(2);
    });
  });

  describe("Submit transactions", function () {
  it("should allow owner to submit transaction", async () => {

    const { multisig, owners } = await loadFixture(deployMultisig);

    const tx = await multisig.connect(owners[0]).submitTransaction(
      owners[1],
      ethers.parseEther("0.1"),
      "0x"
    );

    const receipt = await tx.wait();
    expect(receipt.events[0].event).to.equal("TransactionSubmitted");
    console.log(receipt.events[0].event)

  });
  });

});

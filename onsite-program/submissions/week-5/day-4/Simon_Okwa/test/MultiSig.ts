import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { MultiSig, MultisigFactory } from "../typechain-types";

describe("Multisig Factory & Wallet", function () {
  let factory: MultisigFactory;
  let multisig: MultiSig;
  let owner1: any, owner2: any, owner3: any, nonOwner: any;
  let owner1Addr: string, owner2Addr: string, owner3Addr: string;

  beforeEach(async () => {
    [owner1, owner2, owner3, nonOwner] = await ethers.getSigners();
    owner1Addr = await owner1.getAddress();
    owner2Addr = await owner2.getAddress();
    owner3Addr = await owner3.getAddress();

    // Deploy the factory
    factory = (await ethers.deployContract("MultisigFactory")) as unknown as MultisigFactory;
    await factory.waitForDeployment();

    // Create a new multisig and get the address directly from return value
    const tx = await factory.createMultisig(
      [owner1Addr, owner2Addr, owner3Addr],
      3
    );
    const receipt = await tx.wait();

    // Extract wallet address from event
    const event = receipt?.logs
      .map(log => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(parsed => parsed?.name === "WalletCreated");

    const walletAddress = event?.args?.walletAddress;
    expect(walletAddress).to.properAddress;

    // Get an instance of the deployed multisig
    multisig = (await ethers.getContractAt("Multisig", walletAddress)) as unknown as MultiSig;

    // Fund the multisig with 10 ETH for testing
    await owner1.sendTransaction({
      to: await multisig.getAddress(),
      value: parseEther("10"),
    });
  });

  it("should have correct owners and required signatures", async () => {
    const owners = await multisig.getOwners();
    expect(owners).to.deep.equal([owner1Addr, owner2Addr, owner3Addr]);
    expect(await multisig.getRequiredSignatures()).to.equal(3);
  });

  it("should allow owners to submit, sign, and execute a transaction", async () => {
    const to = await nonOwner.getAddress();
    const value = parseEther("1");
    const data = "0x";

    // Submit transaction
    await multisig.connect(owner1).submitTransaction(to, value, data);

    let txDetails = await multisig.getTransaction(0);
    expect(txDetails[0]).to.equal(to);
    expect(txDetails[1]).to.equal(value);
    expect(txDetails[3]).to.be.false;

    // Sign with all 3 owners
    await multisig.connect(owner1).signTransaction(0);
    await multisig.connect(owner2).signTransaction(0);
    await multisig.connect(owner3).signTransaction(0);

    txDetails = await multisig.getTransaction(0);
    expect(txDetails[3]).to.be.true;
  });

  it("should reject signing from non-owner", async () => {
    await multisig.connect(owner1).submitTransaction(
      await nonOwner.getAddress(),
      parseEther("1"),
      "0x"
    );

    await expect(
      multisig.connect(nonOwner).signTransaction(0)
    ).to.be.revertedWith("Not an owner!");
  });
});

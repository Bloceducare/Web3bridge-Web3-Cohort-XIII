import { expect } from "chai";
import { ethers } from "hardhat"; // Import ethers from hardhat environment
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MultiSigWallet", function () {
  let MultiSigWalletFactory: ContractFactory;
  let MultiSigWallet: ContractFactory;
  let wallet: Contract;
  let factory: Contract;
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let owner3: SignerWithAddress;
  let owner4: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  beforeEach(async function () {
    [owner1, owner2, owner3, owner4, nonOwner] = await ethers.getSigners();
    MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWalletFactory");
    factory = await MultiSigWalletFactory.deploy();

    const tx = await factory.createWallet([owner1.address, owner2.address, owner3.address, owner4.address]);
    const receipt = await tx.wait();
    const walletAddress = receipt.events[0].args.wallet;
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    wallet = await ethers.getContractAt("MultiSigWallet", walletAddress);
  });

  it("should initialize with correct owners", async function () {
    expect(await wallet.isOwner(owner1.address)).to.be.true;
    expect(await wallet.isOwner(nonOwner.address)).to.be.false;
  });

  it("should revert with invalid owners", async function () {
    await expect(factory.createWallet([owner1.address, owner2.address])).to.be.revertedWithCustomError(
      MultiSigWallet,
      "InvalidOwners"
    );
  });

  it("should allow deposits", async function () {
    await owner1.sendTransaction({ to: wallet.address, value: ethers.utils.parseEther("1") });
    expect(await ethers.provider.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("1"));
  });

  it("should propose, approve, and execute a transaction with exactly 3 approvals", async function () {
    await owner1.sendTransaction({ to: wallet.address, value: ethers.utils.parseEther("1") });

    const tx = await wallet.connect(owner1).proposeTransaction(nonOwner.address, ethers.utils.parseEther("0.5"), "0x");
    const receipt = await tx.wait();
    const txId = receipt.events[0].args.txId;

    await wallet.connect(owner1).approveTransaction(txId);
    await wallet.connect(owner2).approveTransaction(txId);
    await expect(wallet.connect(owner1).executeTransaction(txId)).to.be.revertedWithCustomError(
      wallet,
      "NotEnoughApprovals"
    );

    await wallet.connect(owner3).approveTransaction(txId);
    await expect(wallet.connect(owner1).executeTransaction(txId))
      .to.emit(wallet, "TransactionExecuted")
      .withArgs(owner1.address, txId, true);

    expect(await ethers.provider.getBalance(nonOwner.address)).to.be.above(ethers.utils.parseEther("0.5"));
  });

  it("should revert if non-owner tries to propose", async function () {
    await expect(
      wallet.connect(nonOwner).proposeTransaction(nonOwner.address, ethers.utils.parseEther("0.5"), "0x")
    ).to.be.revertedWithCustomError(wallet, "NotOwner");
  });

  it("should revert if transaction is already approved by owner", async function () {
    await owner1.sendTransaction({ to: wallet.address, value: ethers.utils.parseEther("1") });

    const tx = await wallet.connect(owner1).proposeTransaction(nonOwner.address, ethers.utils.parseEther("0.5"), "0x");
    const receipt = await tx.wait();
    const txId = receipt.events[0].args.txId;

    await wallet.connect(owner1).approveTransaction(txId);
    await expect(wallet.connect(owner1).approveTransaction(txId)).to.be.revertedWithCustomError(
      wallet,
      "AlreadyApproved"
    );
  });
});
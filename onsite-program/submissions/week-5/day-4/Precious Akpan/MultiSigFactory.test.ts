import { expect } from "chai";
import hre from "hardhat";
import { MultiSigFactory, MultiSigWallet } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ContractTransactionReceipt } from "ethers";

// Helper function to extract wallet address from WalletCreated event
function getWalletAddressFromEvent(factory: MultiSigFactory, receipt: ContractTransactionReceipt | null): string {
  const event = receipt?.logs.find((log) => {
    try {
      const parsedLog = factory.interface.parseLog({
        topics: log.topics as string[],
        data: log.data
      });
      return parsedLog?.name === "WalletCreated";
    } catch {
      return false;
    }
  });
  
  if (!event) {
    throw new Error("WalletCreated event not found");
  }
  
  const parsedEvent = factory.interface.parseLog({
    topics: event.topics as string[],
    data: event.data
  });
  
  return parsedEvent?.args?.wallet;
}

describe("MultiSigFactory & MultiSigWallet", function () {
  let factory: MultiSigFactory;
  let owners: string[];
  let required: number;
  let wallet: MultiSigWallet;
  let signers: HardhatEthersSigner[];

  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    owners = [signers[0].address, signers[1].address, signers[2].address, signers[3].address];
    required = 3;
    const Factory = await hre.ethers.getContractFactory("MultiSigFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
    
    const tx = await factory.createWallet(owners, required);
    const receipt = await tx.wait();
    
    const walletAddress = getWalletAddressFromEvent(factory, receipt);
    wallet = await hre.ethers.getContractAt("MultiSigWallet", walletAddress);
  });

  it("should deploy a wallet with correct owners and required confirmations", async () => {
    expect(await wallet.getOwners()).to.deep.equal(owners);
    expect(await wallet.required()).to.equal(required);
  });

  it("should not execute transfer until 3 confirmations", async () => {
    const walletAddress = await wallet.getAddress();
    await signers[0].sendTransaction({ to: walletAddress, value: hre.ethers.parseEther("1") });
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.5"));
    await wallet.connect(signers[0]).confirmTransaction(0);
    await wallet.connect(signers[1]).confirmTransaction(0);
    await expect(wallet.connect(signers[0]).executeTransaction(0)).to.be.revertedWith("cannot execute tx");
    await wallet.connect(signers[2]).confirmTransaction(0);
    await expect(wallet.connect(signers[0]).executeTransaction(0)).to.not.be.reverted;
    const balance = await hre.ethers.provider.getBalance(signers[4].address);
    expect(balance).to.be.gt(hre.ethers.parseEther("10000"));
  });

  it("should not allow duplicate confirmations", async () => {
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1"));
    await wallet.connect(signers[0]).confirmTransaction(0);
    await expect(wallet.connect(signers[0]).confirmTransaction(0)).to.be.revertedWith("tx already confirmed");
  });

  it("should not allow non-owner to submit or confirm", async () => {
    await expect(wallet.connect(signers[5]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1"))).to.be.revertedWith("not owner");
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1"));
    await expect(wallet.connect(signers[5]).confirmTransaction(0)).to.be.revertedWith("not owner");
  });

  it("should revert if trying to confirm non-existent transaction", async () => {
    await expect(wallet.connect(signers[0]).confirmTransaction(99)).to.be.revertedWith("tx does not exist");
  });

  it("should revert if trying to execute non-existent transaction", async () => {
    await expect(wallet.connect(signers[0]).executeTransaction(99)).to.be.revertedWith("tx does not exist");
  });

  it("should revert if trying to execute already executed transaction", async () => {
    const walletAddress = await wallet.getAddress();
    await signers[0].sendTransaction({ to: walletAddress, value: hre.ethers.parseEther("1") });
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1"));
    await wallet.connect(signers[0]).confirmTransaction(0);
    await wallet.connect(signers[1]).confirmTransaction(0);
    await wallet.connect(signers[2]).confirmTransaction(0);
    await wallet.connect(signers[0]).executeTransaction(0);
    await expect(wallet.connect(signers[0]).executeTransaction(0)).to.be.revertedWith("tx already executed");
  });

  it("should revert if trying to confirm already executed transaction", async () => {
    const walletAddress = await wallet.getAddress();
    await signers[0].sendTransaction({ to: walletAddress, value: hre.ethers.parseEther("1") });
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1"));
    await wallet.connect(signers[0]).confirmTransaction(0);
    await wallet.connect(signers[1]).confirmTransaction(0);
    await wallet.connect(signers[2]).confirmTransaction(0);
    await wallet.connect(signers[0]).executeTransaction(0);
    await expect(wallet.connect(signers[3]).confirmTransaction(0)).to.be.revertedWith("tx already executed");
  });

  it("should allow more than required confirmations but only execute once", async () => {
    const walletAddress = await wallet.getAddress();
    await signers[0].sendTransaction({ to: walletAddress, value: hre.ethers.parseEther("1") });
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1"));
    await wallet.connect(signers[0]).confirmTransaction(0);
    await wallet.connect(signers[1]).confirmTransaction(0);
    await wallet.connect(signers[2]).confirmTransaction(0);
    await wallet.connect(signers[3]).confirmTransaction(0);
    await expect(wallet.connect(signers[0]).executeTransaction(0)).to.not.be.reverted;
    await expect(wallet.connect(signers[0]).executeTransaction(0)).to.be.revertedWith("tx already executed");
  });

  it("should allow exactly 3 owners and 3 required", async () => {
    const owners3 = [signers[0].address, signers[1].address, signers[2].address];
    const tx = await factory.createWallet(owners3, 3);
    const receipt = await tx.wait();
    
    const walletAddress = getWalletAddressFromEvent(factory, receipt);
    const wallet3 = await hre.ethers.getContractAt("MultiSigWallet", walletAddress);
    expect(await wallet3.getOwners()).to.deep.equal(owners3);
    expect(await wallet3.required()).to.equal(3);
  });

  it("should revert if required is less than 3", async () => {
    const owners3 = [signers[0].address, signers[1].address, signers[2].address];
    await expect(factory.createWallet(owners3, 2)).to.be.revertedWith("invalid params");
  });

  it("should revert if duplicate owners are provided", async () => {
    const ownersDup = [signers[0].address, signers[0].address, signers[1].address];
    await expect(factory.createWallet(ownersDup, 3)).to.be.reverted;
  });

  it("should revert if zero address is provided as owner", async () => {
    const ownersZero = [signers[0].address, hre.ethers.ZeroAddress, signers[1].address];
    await expect(factory.createWallet(ownersZero, 3)).to.be.reverted;
  });

  it("should allow multiple transactions and confirmations independently", async () => {
    const walletAddress = await wallet.getAddress();
    await signers[0].sendTransaction({ to: walletAddress, value: hre.ethers.parseEther("2") });
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.5"));
    await wallet.connect(signers[0]).submitTransaction(signers[5].address, hre.ethers.parseEther("0.5"));
    await wallet.connect(signers[0]).confirmTransaction(0);
    await wallet.connect(signers[1]).confirmTransaction(0);
    await wallet.connect(signers[2]).confirmTransaction(0);
    await wallet.connect(signers[0]).confirmTransaction(1);
    await wallet.connect(signers[1]).confirmTransaction(1);
    await wallet.connect(signers[2]).confirmTransaction(1);
    await expect(wallet.connect(signers[0]).executeTransaction(0)).to.not.be.reverted;
    await expect(wallet.connect(signers[0]).executeTransaction(1)).to.not.be.reverted;
  });

  it("should emit events on deposit, submit, confirm, execute", async () => {
    const walletAddress = await wallet.getAddress();
    await expect(signers[0].sendTransaction({ to: walletAddress, value: hre.ethers.parseEther("1") }))
      .to.emit(wallet, "Deposit");
    await expect(wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1")))
      .to.emit(wallet, "SubmitTransaction");
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1"));
    await expect(wallet.connect(signers[0]).confirmTransaction(1)).to.emit(wallet, "ConfirmTransaction");
    await wallet.connect(signers[1]).confirmTransaction(1);
    await wallet.connect(signers[2]).confirmTransaction(1);
    await expect(wallet.connect(signers[0]).executeTransaction(1)).to.emit(wallet, "ExecuteTransaction");
  });

  it("should track all created wallets in the factory", async () => {
    const owners3 = [signers[0].address, signers[1].address, signers[2].address];
    await factory.createWallet(owners3, 3);
    const allWallets = await factory.getAllWallets();
    expect(allWallets.length).to.be.gte(2); // at least two wallets created
  });

  it("should return correct transaction count and details", async () => {
    await wallet.connect(signers[0]).submitTransaction(signers[4].address, hre.ethers.parseEther("0.1"));
    const count = await wallet.getTransactionCount();
    expect(count).to.equal(1);
    const tx = await wallet.getTransaction(0);
    expect(tx.to).to.equal(signers[4].address);
    expect(tx.value).to.equal(hre.ethers.parseEther("0.1"));
    expect(tx.executed).to.equal(false);
    expect(tx.numConfirmations).to.equal(0);
  });

  it("should allow wallet to receive Ether directly", async () => {
    const walletAddress = await wallet.getAddress();
    const tx = await signers[0].sendTransaction({ to: walletAddress, value: hre.ethers.parseEther("1") });
    await tx.wait();
    const balance = await hre.ethers.provider.getBalance(walletAddress);
    expect(balance).to.equal(hre.ethers.parseEther("1"));
  });

  it("should allow required to be equal to number of owners", async () => {
    const owners4 = [signers[0].address, signers[1].address, signers[2].address, signers[3].address];
    const tx = await factory.createWallet(owners4, 4);
    const receipt = await tx.wait();
    
    const walletAddress = getWalletAddressFromEvent(factory, receipt);
    const wallet4 = await hre.ethers.getContractAt("MultiSigWallet", walletAddress);
    expect(await wallet4.required()).to.equal(4);
  });
});

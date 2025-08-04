const { expect } = require("chai");
const hre = require("hardhat");

describe("MultiSigWallet", function () {
  it("should successfully execute a transaction after reaching the confirmation threshold", async function () {
    const [owner1, owner2, owner3, otherAccount] = await hre.ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const requiredConfirmations = 2;

    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
    const multiSigWallet = await MultiSigWallet.deploy(owners, requiredConfirmations);

    const toAddress = otherAccount.address;
    const valueToSend = hre.ethers.parseEther("1.0");

    await owner1.sendTransaction({
      to: multiSigWallet.getAddress(),
      value: valueToSend,
    });

    const initialBalance = await hre.ethers.provider.getBalance(toAddress);

    const tx = await multiSigWallet.connect(owner1).submitTransaction(toAddress, valueToSend, "0x");
    const receipt = await tx.wait();

    if (!receipt || !receipt.logs || receipt.logs.length === 0) {
      throw new Error("No logs found in transaction receipt");
    }

    const multiSigWalletInterface = multiSigWallet.interface;
    const multiSigAddress = await multiSigWallet.getAddress();
    const log = receipt.logs.find((l: any) => l.address === multiSigAddress);
    if (!log) {
      throw new Error("Log from MultiSigWallet contract not found");
    }
    const parsedLog = multiSigWalletInterface.parseLog(log as any);
    
    const txId = (parsedLog!.args as any).txId;

    await multiSigWallet.connect(owner1).confirmTransaction(txId);
    
    await multiSigWallet.connect(owner2).confirmTransaction(txId);

    await multiSigWallet.connect(owner1).executeTransaction(txId);

    const finalBalance = await hre.ethers.provider.getBalance(toAddress);
    
    expect(finalBalance).to.equal(initialBalance + valueToSend);

    const transaction = await multiSigWallet.getTransaction(txId);
    expect(transaction[3]).to.be.true;
  });
});

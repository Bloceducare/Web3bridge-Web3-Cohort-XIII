import { ethers } from "hardhat";
import { expect } from "chai";

describe("SimpleMultiSig + Factory", function () {
  it("should deploy factory and create multisig, approve and execute tx", async function () {
    const [owner1, owner2, owner3, owner4, owner5, recipient] = await ethers.getSigners();

    
    const Factory = await ethers.getContractFactory("SimpleMultiSigFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();


    const users = [owner1.address, owner2.address, owner3.address, owner4.address, owner5.address];
    await factory.createMultiSig(users, 3);

    const deployed = await factory.getDeployed();
    const multisigAddr = deployed[0];

    
    const MultiSig = await ethers.getContractFactory("SimpleMultiSig");
    const multisig = MultiSig.attach(multisigAddr);

    
    await owner1.sendTransaction({ to: multisigAddr, value: ethers.parseEther("5") });

    
    await multisig.connect(owner1).submitTx(recipient.address, ethers.parseEther("2"));

    
    await multisig.connect(owner1).approveTx(0);
    await multisig.connect(owner2).approveTx(0);
    await multisig.connect(owner3).approveTx(0);

    
    const balBefore = await ethers.provider.getBalance(recipient.address);
    await multisig.connect(owner1).executeTx(0);
    const balAfter = await ethers.provider.getBalance(recipient.address);

    expect(balAfter - balBefore).to.equal(ethers.parseEther("2"));
  });
});

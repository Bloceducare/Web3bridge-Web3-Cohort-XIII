// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("MultiSignWallet", function () {
//   let wallet, deployer, signer1, signer2, signer3, notOwner;

//   beforeEach(async () => {
//     [deployer, signer1, signer2, signer3, notOwner] = await ethers.getSigners();

//     const MultiSignWallet = await ethers.getContractFactory(
//       "MultiSignWallet",
//       deployer
//     );
//     wallet = await MultiSignWallet.deploy(
//       [signer1.address, signer2.address, signer3.address],
//       2
//     );
//     await wallet.deployed();
//   });

//   it("Should deploy with correct owners and required confirmations", async () => {
//     expect(await wallet.requiredSignature()).to.equal(2);
//     expect(await wallet.isOwner(signer1.address)).to.be.true;
//     expect(await wallet.isOwner(notOwner.address)).to.be.false;
//   });

//   it("Allows owner to submit a transaction", async () => {
//     const tx = await wallet
//       .connect(signer1)
//       .submitTransaction(notOwner.address, 10, "0x");
//     await expect(tx).to.emit(wallet, "TransactionSubmittd");
//     const txCount = await wallet.transactionCount();
//     expect(txCount).to.equal(1);
//   });

//   it("Prevents non-owner from submitting a transaction", async () => {
//     await expect(
//       wallet.connect(notOwner).submitTransaction(signer1.address, 10, "0x")
//     ).to.be.revertedWith("not owner");
//   });

//   it("Allows owners to confirm ");
// });

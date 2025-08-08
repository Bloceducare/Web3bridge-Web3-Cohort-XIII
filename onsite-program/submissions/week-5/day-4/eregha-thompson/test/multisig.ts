// import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
// import { expect } from "chai";
// import {ethers}  from "hardhat";
// import hre from "hardhat";

// describe("Mulisig", function () {
//   // We define a fixture to reuse the same setup in every test.
//   // We use loadFixture to run this setup once, snapshot that state,
//   // and reset Hardhat Network to that snapshot in every test.
//   async function deployMultisig() {
//     // Contracts are deployed using the first signer/account by default
//     const [owner, firstAddress, secondAddress, thirdAddress,nonAdmin] =
//       await hre.ethers.getSigners();
//     const first = firstAddress.address;
//     const second = secondAddress.address;
//     const third = thirdAddress.address;


//     const multisigs = await hre.ethers.getContractFactory("multisig");
//     // const transfer =hre.ethers.parseEther("0.5");
//     const multis = await multisigs.deploy([owner.address,first, second], {
//       value: ethers.parseEther("10"),
//     });

//     return { multis, owner, firstAddress, secondAddress, thirdAddress,nonAdmin };
//   }

//   describe("Deployment", function () {
//     it("Should set the right deployment address", async function () {
//       const { multis, owner } = await loadFixture(deployMultisig);

//       expect(await multis.getAddress()).to.be.properAddress;
//     });
//     //  it("Should set admins correctly", async function () {
//     //   const { multi, owner, firstAddress, secondAddress, thirdAddress } = await loadFixture(deployMultisig);

//     //   expect(await multi.isAdmin(owner.address)).to.be.true;
//     //   expect(await multi.isAdmin(firstAddress.address)).to.be.true;
//     //   expect(await multi.isAdmin(secondAddress.address)).to.be.true;
//     // });
//   });
//   describe("create transaction", function () {
//     it("should create a transaction", async function () {
//       const { multis, owner, firstAddress, secondAddress, thirdAddress } =
//         await loadFixture(deployMultisig);

//       const contractAddress = await multis.getAddress();
//       const amount = hre.ethers.parseEther("2");
//       owner.sendTransaction({
//         to: contractAddress,
//         value: amount,  
//         const transfer = hre.ethers.parseEther("0.5");
//       await multis.createTransaction(  const transferAmount = hre.ethers.parseEther("0.5");
//       await multis.createTransaction(
//         await thirdAddress.getAddress(),
//         transferAmount
//       );
//       const allTransactions = await multis.getTransaction(1);
//       expect(allTransactions.length).to.equal(1);
//         await thirdAddress.getAddress(),
//         transferAmount
//       );
//       const allTransactions = await multis.getTransaction(1);
//       expect(allTransactions.length).to.equal(1);
//       });
//       expect
//       const transferAmount = hre.ethers.parseEther("0.5");
//       await multis.createTransaction(
//         await thirdAddress.getAddress(),
//         transferAmount
//       );
//       const allTransactions = await multis.getTransaction(1);
//       expect(allTransactions.length).to.equal(1);
//     });
//   });
// });

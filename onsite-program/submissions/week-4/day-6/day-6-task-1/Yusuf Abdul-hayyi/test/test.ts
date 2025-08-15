// import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { expect } from "chai";
// import hre from "hardhat";

// describe("WEB3B", function () {

//   // Should deploy and set owner correctly", Contracts are deployed using the first signer/account by default

//   async function deployERC20Token() {
//     const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();

//     const name = "Web3BToken";
//     const symbol = "W3B";
//     const decimals = 18;
//     const totalSupply = hre.ethers.parseUnits("100000000", decimals);

//     const WEB3B = await hre.ethers.getContractFactory("WEB3B");
//     const web3b = await WEB3B.deploy(name, symbol, decimals, totalSupply);

//     console.log("Signer1 address:", owner.address);
//     console.log("Signer2 address:", otherAccount.address);

//     return { web3b, name, symbol, decimals, totalSupply, owner, otherAccount, thirdAccount };
//   }

//   describe("Deployment", function () {
//     it("Should deploy and set owner correctly", async function () {
//       const { web3b, name, symbol, decimals, totalSupply, owner } = await loadFixture(deployERC20Token);

//       expect(await web3b.name()).to.equal(name);
//       expect(await web3b.symbol()).to.equal(symbol);
//       expect(await web3b.decimals()).to.equal(decimals);
//       expect(await web3b.owner()).to.equal(owner.address);
//       expect(await web3b.balanceOf(owner.address)).to.equal(totalSupply);
//     });
//   });

//   describe("Transfer token", function () {
//     it("Should transfer token to recipient when amount <= owner's balance", async function () {
//       const { web3b, owner, otherAccount } = await loadFixture(deployERC20Token);

//       const transferAmount = hre.ethers.parseUnits("200", 18);
      
//       await expect(web3b.transfer(otherAccount.address, transferAmount))
//         .to.emit(web3b, "Transfer")
//         .withArgs(owner.address, otherAccount.address, transferAmount);

//       // Verify balances after transfer
//       expect(await web3b.balanceOf(otherAccount.address)).to.equal(transferAmount);
//     });

//     it("Should fail when transfer amount > owner's balance", async function () {
//       const { web3b, owner, otherAccount, totalSupply } = await loadFixture(deployERC20Token);

//       const excessiveAmount = totalSupply + hre.ethers.parseUnits("1", 18);
      
//       await expect(web3b.transfer(otherAccount.address, excessiveAmount))
//         .to.be.revertedWithCustomError(web3b, "INSUFFICIENT_BALANCE");
//     });

//     it("Should handle zero amount transfers", async function () {
//       const { web3b, owner, otherAccount } = await loadFixture(deployERC20Token);

//       await expect(web3b.transfer(otherAccount.address, 0))
//         .to.emit(web3b, "Transfer")
//         .withArgs(owner.address, otherAccount.address, 0);
//     });
//   });

//   describe("Approval", function () {
//     it("Should approve spender to spend tokens", async function () {
//       const { web3b, owner, otherAccount } = await loadFixture(deployERC20Token);

//       const approvalAmount = hre.ethers.parseUnits("1000", 18);
      
//       await expect(web3b.approve(otherAccount.address, approvalAmount))
//         .to.emit(web3b, "Approval")
//         .withArgs(owner.address, otherAccount.address, approvalAmount);

//       expect(await web3b.allowance(owner.address, otherAccount.address)).to.equal(approvalAmount);
//     });

//     it("Should update approval amount", async function () {
//       const { web3b, owner, otherAccount } = await loadFixture(deployERC20Token);

//       const firstApproval = hre.ethers.parseUnits("500", 18);
//       const secondApproval = hre.ethers.parseUnits("1500", 18);
      
//       await web3b.approve(otherAccount.address, firstApproval);
//       expect(await web3b.allowance(owner.address, otherAccount.address)).to.equal(firstApproval);
      
//       await web3b.approve(otherAccount.address, secondApproval);
//       expect(await web3b.allowance(owner.address, otherAccount.address)).to.equal(secondApproval);
//     });
//   });

//   describe("TransferFrom", function () {
//     it("Should fail due to contract bug in transferFrom logic", async function () {
//       const { web3b, owner, otherAccount, thirdAccount } = await loadFixture(deployERC20Token);

//       const approvalAmount = hre.ethers.parseUnits("1000", 18);
//       const transferAmount = hre.ethers.parseUnits("500", 18);
      
//       // Owner approves otherAccount to spend tokens
//       await web3b.approve(otherAccount.address, approvalAmount);
      
//       // This should work but will fail due to contract bug
//       // The contract checks balanceOf[msg.sender] instead of balanceOf[sender]
//       await expect(
//         web3b.connect(otherAccount).transferFrom(owner.address, thirdAccount.address, transferAmount)
//       ).to.be.revertedWithCustomError(web3b, "ALLOWANCE_EXCEEDED");
//     });

//     it("Should demonstrate workaround for contract bug", async function () {
//       const { web3b, owner, otherAccount, thirdAccount } = await loadFixture(deployERC20Token);

//       // Due to the bug, we need to give otherAccount some tokens first
//       await web3b.transfer(otherAccount.address, hre.ethers.parseUnits("2000", 18));
      
//       // And otherAccount needs to approve owner (backwards due to bug)
//       await web3b.connect(otherAccount).approve(owner.address, hre.ethers.parseUnits("1000", 18));
      
//       const transferAmount = hre.ethers.parseUnits("500", 18);
      
//       // Now it will work (but with wrong logic)
//       await expect(
//         web3b.connect(otherAccount).transferFrom(owner.address, thirdAccount.address, transferAmount)
//       ).to.emit(web3b, "Transfer")
//         .withArgs(owner.address, thirdAccount.address, transferAmount);
//     });
//   });

//   describe("Edge Cases", function () {
//     it("Should handle self-transfers", async function () {
//       const { web3b, owner, totalSupply } = await loadFixture(deployERC20Token);

//       const transferAmount = hre.ethers.parseUnits("100", 18);
      
//       await expect(web3b.transfer(owner.address, transferAmount))
//         .to.emit(web3b, "Transfer")
//         .withArgs(owner.address, owner.address, transferAmount);
      
//       // Balance should remain the same
//       expect(await web3b.balanceOf(owner.address)).to.equal(totalSupply);
//     });

//     it("Should handle multiple transfers correctly", async function () {
//       const { web3b, owner, otherAccount, thirdAccount } = await loadFixture(deployERC20Token);

//       const amount1 = hre.ethers.parseUnits("1000", 18);
//       const amount2 = hre.ethers.parseUnits("300", 18);
      
//       // Owner -> otherAccount
//       await web3b.transfer(otherAccount.address, amount1);
      
//       // otherAccount -> thirdAccount
//       await web3b.connect(otherAccount).transfer(thirdAccount.address, amount2);
      
//       expect(await web3b.balanceOf(otherAccount.address)).to.equal(amount1 - amount2);
//       expect(await web3b.balanceOf(thirdAccount.address)).to.equal(amount2);
//     });

//     it("Should handle maximum approval amounts", async function () {
//       const { web3b, owner, otherAccount } = await loadFixture(deployERC20Token);

//       const maxAmount = hre.ethers.MaxUint256;
      
//       await expect(web3b.approve(otherAccount.address, maxAmount))
//         .to.emit(web3b, "Approval")
//         .withArgs(owner.address, otherAccount.address, maxAmount);

//       expect(await web3b.allowance(owner.address, otherAccount.address)).to.equal(maxAmount);
//     });
//   });

//   describe("Contract Issues", function () {
//     it("Should note that totalSupply is not updated in constructor", async function () {
//       const { web3b } = await loadFixture(deployERC20Token);

//       // This is a bug in your contract - totalSupply should be set in constructor
//       expect(await web3b.totalSupply()).to.equal(0);
//       // But owner has all the tokens
//       expect(await web3b.balanceOf((await hre.ethers.getSigners())[0].address)).to.be.greaterThan(0);
//     });
//   });
// });
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";
import { expect } from "chai";
import { ethers } from "hardhat";

enum AccountType {
  DEFAULT,
  ETHER,
  ERC20,
}
describe("wallet", () => {
  let walletType: number = 0;
  async function deployWallet() {
    const walletInit = await hre.ethers.getContractFactory("PiggyWallet");
    let [user1, user2, user3] = await hre.ethers.getSigners();
    walletType = 2;
    const wallet = await walletInit.deploy(
      1,
      "abbey wallet",
      walletType,
      "0x0000000000000000001"
    );
    return { wallet, user1, user2, user3 };
  }

  describe("deposit after creation tests", () => {
    it("depositETh for altTokens wallet fails", async () => {
      let [user1, user2, user3] = await hre.ethers.getSigners();
      walletType = 2;
      const tokenContract = await hre.ethers.getContractFactory("TestToken");
      const token = await tokenContract
        .connect(user2)
        .deploy("name Token", "NTK", 10, 500);
      const walletInit = await hre.ethers.getContractFactory("PiggyWallet");
      const wallet = await walletInit
        .connect(user1)
        .deploy(1, "abbey wallet", walletType, token.getAddress());
      const depositAmount = await hre.ethers.parseEther("0.5");
      await expect(
        wallet.connect(user1).depositEth({ value: depositAmount })
      ).to.be.revertedWithCustomError(wallet, "TRANSACTION_NOT_SUPPORTED()");
      const user2Bal = await token.balanceOf(user2.address);
      let expectedBalance = hre.ethers.formatUnits("5000000000000", 0);
      expect(user2Bal).to.equal(expectedBalance);
      await token.connect(user2).transfer(user1.address, 5000);
      const user1Bal = await token.balanceOf(user1.address);
      expectedBalance = hre.ethers.formatUnits("5000", 0);
      const user1BalStr = hre.ethers.formatUnits(user1Bal, 0);
      expect(user1BalStr).to.equal("5000");
    });
    it("tests only depositEth works for eth compatible wallets", async () => {
      walletType = 1;
      const walletInit = await hre.ethers.getContractFactory("PiggyWallet");
      let [user1, user2, user3] = await hre.ethers.getSigners();
      const wallet = await walletInit
        .connect(user1)
        .deploy(
          1,
          "abbey wallet",
          walletType,
          "0x0000000000000000000000000000000000000001"
        );
      const depositAmount = await hre.ethers.parseEther("0.5");
      await wallet.connect(user1).depositEth({ value: depositAmount });
      const balance = await wallet.connect(user1).getBalance();
      expect(balance).to.be.equal(depositAmount);
    });
  });
  describe("withdraw", () => {
    it("tests user can withdraw without lock in an eth wallet", async () => {
      walletType = 2;
      let [user1, user2] = await hre.ethers.getSigners();
      const tokenContract = await hre.ethers.getContractFactory("TestToken");
      const token = await tokenContract
        .connect(user2)
        .deploy("name Token", "NTK", 10, 500);
        const walletInit = await hre.ethers.getContractFactory("PiggyWallet");
        
      const wallet = await walletInit
        .connect(user1)
            .deploy(1, "abbey wallet", walletType, await token.getAddress());
        
      const depositAmount = await hre.ethers.parseEther("0.5");
      await expect(wallet.connect(user1).depositEth({ value: depositAmount })).to.be.revertedWithCustomError(wallet, "TRANSACTION_NOT_SUPPORTED()");

      const user2Bal = await token.balanceOf(user2.address);
      let expectedBalance = hre.ethers.formatUnits("5000000000000", 0);
      expect(user2Bal).to.equal(expectedBalance);
      await token.connect(user2).transfer(user1.address, 5000);
        const user1Bal = await token.balanceOf(user1.address);
        console.log("user1Bal = ",user1Bal)
      expectedBalance = hre.ethers.formatUnits("5000", 0);
      await expect(
        wallet.connect(user1).deposit(50000)
        ).to.be.revertedWithCustomError(wallet, "INSUFFICIENT_BALANCE()");
        await token.connect(user1).approve(await wallet.getAddress(), 5000);
        await wallet.connect(user1).deposit(5000);
        const balance = await wallet.getBalance();
        expect(balance).to.equal(5000);
        await wallet.connect(user1).withdrawTo(user2.address, 4000);
        const newBalance = await wallet.getBalance();
        expect(newBalance).to.equal(1000);
    });
  });
    describe("lock", () => { 
        it("test user cannot use locked funds", async ()=>{
         let [user1, user2] = await hre.ethers.getSigners();
        const tokenContract = await hre.ethers.getContractFactory("TestToken");
        const token = await tokenContract
        .connect(user2)
        .deploy("name Token", "NTK", 10, 500);
        const walletInit = await hre.ethers.getContractFactory("PiggyWallet");
        const wallet = await walletInit
            .connect(user1)
            .deploy(1, "abbey wallet", 2, await token.getAddress());
        await token.connect(user2).transfer(user1.address, 5000);
        await token.connect(user1).approve(wallet.getAddress(), 5000);
        await wallet.connect(user1).deposit(5000);
        await wallet.connect(user1).withdrawTo(user2.address, 4000);
        await wallet.connect(user1).lockFunds(10000);   
        })
    })
    
});

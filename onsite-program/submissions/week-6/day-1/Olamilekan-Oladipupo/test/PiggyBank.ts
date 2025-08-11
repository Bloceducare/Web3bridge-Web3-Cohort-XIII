import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { connect } from "http2";

// import { TokenType } from "../contracts/interfaces/IPiggyBank.sol";

describe("PiggBank", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPiggyBank() {
    const initial_supply = 100000000000;


    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, accountB, admin] = await hre.ethers.getSigners();
    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.connect(owner).deploy(initial_supply);

    const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
    const piggyBank = await PiggyBank.connect(owner).deploy(token.target, admin);

    return { piggyBank, token, owner, otherAccount, accountB};
  }

  describe("test createSaving", function () {
    it("Should create saving", async function () {
      const {piggyBank, token, owner } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 0;
      const _amount = 100000;
      const _duration = 0;
    
      await token.connect(owner).approve(piggyBank.target, _amount);


      await piggyBank.connect(owner).createSavings(_savingName, _tokenType, _amount, _duration);
      const saving = await piggyBank.getSaving(0);
      expect(saving.name).to.equal(_savingName);
      expect(saving.tokenType).to.equal(_tokenType);
      expect(saving.amount).to.equal(_amount);
      expect(saving.duration).to.equal(_duration);
      expect(await token.balanceOf(piggyBank.target)).to.equal(_amount);
    });

    it("Should create fail when saving is called with INSUFFICIENT balance for Erc 20", async function () {
      const {piggyBank, token, owner, otherAccount } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 0;
      const _amount = 100000;
      const _duration = 0;

  
      
      await expect(piggyBank.connect(otherAccount).createSavings(_savingName, _tokenType, _amount, _duration)).to.revertedWithCustomError(piggyBank, "INSUFFICIENT_BALANCE");
     
      
    });
    it("Should create fail when saving is called with INSUFFICENT_ALLOWANCE balance for Erc 20", async function () {
      const {piggyBank, token, owner, otherAccount } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 0;
      const _amount = 100000;
      const _duration = 0;

      const balance = await token.balanceOf(owner.address);
      console.log("balance :::::::::::::::::::::::::::::::", balance);

      await token.approve(piggyBank.target, _amount - 50000);

      await expect(piggyBank.createSavings(_savingName, _tokenType, _amount, _duration)).to.revertedWithCustomError(piggyBank, "INSUFFICENT_ALLOWANCE");
    });

    it("Shouldfail when saving is called with 0 balance for Eth", async function () {
      const {piggyBank, token, owner, otherAccount } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 1;
      const _amount = 100000;
      const _duration = 0;

      await expect(piggyBank.createSavings(_savingName, _tokenType, _amount, _duration)).to.revertedWithCustomError(piggyBank, "CAN_NOT_LOCK_ZERO_VALUE");
    });

      it("Shouldfail when saving is called with less ether than specify", async function () {
      const {piggyBank, token, owner, otherAccount } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 1;
      const _amount = 100000;
      const _duration = 0;

      await expect(piggyBank.createSavings(_savingName, _tokenType, _amount, _duration, {value: ethers.parseEther("0.1")})).to.revertedWithCustomError(piggyBank, "AMOUNT_TO_DEPOSIT_IS_NOT_EQUAL_TO_AMOUNT");
    });

    
    it("Should create saving when called with valid eth ", async function () {
      const {piggyBank, token, owner } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 1;
      const _amount = 1;
      const _duration = 0;

      const contractBalance = await ethers.provider.getBalance(piggyBank.target);
      console.log("Balance ::::::::::::::::::::: ", contractBalance)
    


      await piggyBank.createSavings(_savingName, _tokenType, ethers.parseEther(_amount.toString()), _duration , {value: ethers.parseEther(_amount.toString())});
      const saving = await piggyBank.getSaving(0);
      expect(saving.name).to.equal(_savingName);
      expect(saving.tokenType).to.equal(_tokenType);
      expect(saving.amount).to.equal(ethers.parseEther(_amount.toString()));
      expect(saving.duration).to.equal(_duration);
      expect(await ethers.provider.getBalance(piggyBank.target)).to.equal(contractBalance + ethers.parseEther(_amount.toString()));
    });

     it("Should get saving ", async function () {
      const {piggyBank, token, owner } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 0;
      const _amount = 100000;
      const _duration = 0;
    
      await token.approve(piggyBank.target, _amount);

      await piggyBank.createSavings(_savingName, _tokenType, _amount, _duration);
      const saving = await piggyBank.getSaving(0);
      expect((await piggyBank.getAllSavings()).length).to.equal(1)
      expect(saving.name).to.equal(_savingName);
      expect(saving.tokenType).to.equal(_tokenType);
      expect(saving.amount).to.equal(_amount);
      expect(saving.duration).to.equal(_duration);
      expect(await token.balanceOf(piggyBank.target)).to.equal(_amount);
    });

      it("Should get multiple saving ", async function () {
      const {piggyBank, token, owner } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 0;
      const _amount = 100000;
      const _duration = 0;
    
      await token.approve(piggyBank.target, _amount);

      await piggyBank.createSavings(_savingName, _tokenType, _amount, _duration);
      const saving = await piggyBank.getSaving(0);
      expect((await piggyBank.getAllSavings()).length).to.equal(1)
      expect(saving.name).to.equal(_savingName);
      expect(saving.tokenType).to.equal(_tokenType);
      expect(saving.amount).to.equal(_amount);
      expect(saving.duration).to.equal(_duration);
      expect(await token.balanceOf(piggyBank.target)).to.equal(_amount);



      const _savingName2 = "Buy laptop";
      const  _tokenType2 = 0;
      const _amount2 = 100000;
      const _duration2 = 0;
    
      await token.approve(piggyBank.target, _amount2);

      await piggyBank.createSavings(_savingName2, _tokenType2, _amount2, _duration2);
      const saving2 = await piggyBank.getSaving(1);
      expect((await piggyBank.getAllSavings()).length).to.equal(2)
      expect(saving2.name).to.equal(_savingName2);
      expect(saving2.tokenType).to.equal(_tokenType2);
      expect(saving2.amount).to.equal(_amount2);
      expect(saving2.duration).to.equal(_duration2);
      expect(await token.balanceOf(piggyBank.target)).to.equal(_amount2+_amount);
      expect(saving2.savingsId).to.equals(1);
    });
    it("Should fail when withdraw is call with id < 0", async function () {
      const {piggyBank, token, owner } = await loadFixture(deployPiggyBank);
      

      const _savingName = "Buy laptop";
      const  _tokenType = 0;
      const _amount = 100000;
      const _duration = 0;
    
      await token.approve(piggyBank.target, _amount);


      await piggyBank.connect(owner).createSavings(_savingName, _tokenType, _amount, _duration);
      const saving = await piggyBank.getSaving(0);
      expect(saving.name).to.equal(_savingName);
      expect(saving.tokenType).to.equal(_tokenType);
      expect(saving.amount).to.equal(_amount);
      expect(saving.duration).to.equal(_duration);
      expect(await token.balanceOf(piggyBank.target)).to.equal(_amount);

      await expect(piggyBank.withdraw(1)).to.revertedWithCustomError(piggyBank,"SAVING_ALREADY_WITHDRAWN");
    });

    // it("Should remove fee when withdraw is called before due date", async function () {
    //   const {piggyBank, token, owner } = await loadFixture(deployPiggyBank);
      

    //   const _savingName = "Buy laptop";
    //   const  _tokenType = 0;
    //   const _amount = 100000;
    //   const _duration = 0;
    
    //   await token.approve(piggyBank.target, _amount);

      
    //   const balance = await token.balanceOf(owner.address);

    //   await piggyBank.connect(owner).createSavings(_savingName, _tokenType, _amount, _duration);
    
    //   const saving = await piggyBank.getSaving(0);
    //   expect(saving.name).to.equal(_savingName);
    //   expect(saving.tokenType).to.equal(_tokenType);
    //   expect(saving.amount).to.equal(_amount);
    //   expect(saving.duration).to.equal(_duration);
    //   expect(await token.balanceOf(piggyBank.target)).to.equal(_amount);

    //   const response = await piggyBank.withdraw(0);
    //   expect(response).to.equal(true);
    //   const penalty = _amount.mul(3).div(100);
    //   const expectedBalance = balance.sub(penalty);      
    //   expect(await token.balanceOf(owner.address)).to.equal(expectedBalance);


    // });








    




    


    

  //   it("Should set the right owner", async function () {
  //     const { lock, owner } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.owner()).to.equal(owner.address);
  //   });

  //   it("Should receive and store the funds to lock", async function () {
  //     const { lock, lockedAmount } = await loadFixture(
  //       deployOneYearLockFixture
  //     );

  //     expect(await hre.ethers.provider.getBalance(lock.target)).to.equal(
  //       lockedAmount
  //     );
  //   });

  //   it("Should fail if the unlockTime is not in the future", async function () {
  //     // We don't use the fixture here because we want a different deployment
  //     const latestTime = await time.latest();
  //     const Lock = await hre.ethers.getContractFactory("Lock");
  //     await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
  //       "Unlock time should be in the future"
  //     );
  //   });
  // });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  });
});

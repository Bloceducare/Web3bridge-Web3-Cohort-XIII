import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20Token Deployment", function () {
  async function deployERC20Token() {

    const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");
    const erc20token = await ERC20Token.deploy("MAVERICK", "MVK", 100000000);
    const [owner,otherAccount] = await hre.ethers.getSigners();

    return { erc20token,owner,otherAccount };
  }

  describe("BalanceOf", function () {
    it("Should get the balance of an address", async function () {
      const { erc20token, owner,otherAccount} = await loadFixture(deployERC20Token);

      const account = owner.address;

      var response = await erc20token.balanceOf(account);

      expect(response,`BALANCE NOT EQUAL ${response}`).to.equal(100000000);
    });

  });

  describe("Transfer to", function (){
    it("Should transfer amount to another address", async function () {
      const {erc20token, owner, otherAccount} = await loadFixture(deployERC20Token);

      await erc20token.transfer(otherAccount.address, 10000000);

      const ownerBalance = await erc20token.balanceOf(owner);
      const recipientBalance = await erc20token.balanceOf(otherAccount);

      expect(ownerBalance).to.equal(90000000);
      expect(recipientBalance).to.equal(10000000);
      
    });

    // it("Should fail to transfer amount if there's insufficient funds in the account", async function() {
    //   const {erc20token, otherAccount} = await loadFixture(deployERC20Token);
    //   await expect(
    //     erc20token.connect(otherAccount).transfer("0x0000000000000000000000000000000000000001", 500000)
    //   ).to.be.revertedWith("INSUFFICIENT_BALANCE");
      
    // });

  });

  describe("Allowance", function (){
    it("Should return 0 if there is no approval"), async function () {
      const {erc20token, owner, otherAccount} = await loadFixture(deployERC20Token);

      const allowance = await erc20token._allowance(owner.address, otherAccount.address);
      expect (allowance).to.equal(0);
      
    }
  }

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
  // });
});
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, BigNumberish } from "ethers";

type PiggyBankFactory = any;
type PiggyBank = any;

describe("PiggyBankFactory", function () {
  let piggyBankFactory: PiggyBankFactory;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  const lockPeriod1 = 30 * 24 * 60 * 60; 
  const lockPeriod2 = 60 * 24 * 60 * 60; 
  const depositAmount = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    piggyBankFactory = await PiggyBankFactory.deploy();
    await piggyBankFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await piggyBankFactory.owner()).to.equal(ownerAddress);
    });

    it("Should start with zero piggy banks", async function () {
      expect(await piggyBankFactory.getAllPiggyBanks()).to.deep.equal([]);
    });
  });

  describe("Creating Piggy Banks", function () {
    it("Should create Ether piggy bank successfully", async function () {
      const tx = await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: depositAmount });
      const receipt = await tx.wait();
      
     
      const event = receipt!.logs.find((log: any) => {
        try {
          return piggyBankFactory.interface.parseLog(log)?.name === "PiggyBankCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = piggyBankFactory.interface.parseLog(event as any);
      const piggyBankAddress = parsedEvent!.args[1];
      
      expect(await piggyBankFactory.getUserPiggyBankCount(user1Address)).to.equal(1);
      expect(await piggyBankFactory.getAllPiggyBanks()).to.have.lengthOf(1);
    });

    it("Should create multiple piggy banks for same user", async function () {
     
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: depositAmount });
      
      
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod2, ethers.ZeroAddress, { value: depositAmount });

      expect(await piggyBankFactory.getUserPiggyBankCount(user1Address)).to.equal(2);
      expect(await piggyBankFactory.getAllPiggyBanks()).to.have.lengthOf(2);
    });

    it("Should track user piggy banks correctly", async function () {
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: depositAmount });
      await piggyBankFactory.connect(user2).createPiggyBank(lockPeriod2, ethers.ZeroAddress, { value: depositAmount });

      const user1PiggyBanks = await piggyBankFactory.getUserPiggyBanks(user1Address);
      const user2PiggyBanks = await piggyBankFactory.getUserPiggyBanks(user2Address);

      expect(user1PiggyBanks).to.have.lengthOf(1);
      expect(user2PiggyBanks).to.have.lengthOf(1);
      expect(user1PiggyBanks[0]).to.not.equal(user2PiggyBanks[0]);
    });

    it("Should require positive lock period", async function () {
      await expect(
        piggyBankFactory.connect(user1).createPiggyBank(0, ethers.ZeroAddress, { value: depositAmount })
      ).to.be.revertedWith("Lock period must be greater than 0");
    });

    it("Should require Ether value when creating Ether piggy bank", async function () {
      await expect(
        piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: 0 })
      ).to.be.revertedWith("Must send Ether when creating Ether piggy bank");
    });
  });

  describe("User Management", function () {
    beforeEach(async function () {
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: depositAmount });
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod2, ethers.ZeroAddress, { value: depositAmount });
    });

    it("Should return correct user piggy bank count", async function () {
      expect(await piggyBankFactory.getUserPiggyBankCount(user1Address)).to.equal(2);
      expect(await piggyBankFactory.getUserPiggyBankCount(user2Address)).to.equal(0);
    });

    it("Should return correct user piggy banks", async function () {
      const userPiggyBanks = await piggyBankFactory.getUserPiggyBanks(user1Address);
      expect(userPiggyBanks).to.have.lengthOf(2);
    });

    it("Should return all piggy banks", async function () {
      const allPiggyBanks = await piggyBankFactory.getAllPiggyBanks();
      expect(allPiggyBanks).to.have.lengthOf(2);
    });
  });

  describe("Removing Piggy Banks", function () {
    let piggyBankAddress: string;

    beforeEach(async function () {
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: depositAmount });
      const userPiggyBanks = await piggyBankFactory.getUserPiggyBanks(user1Address);
      piggyBankAddress = userPiggyBanks[0];
    });

    it("Should remove piggy bank successfully", async function () {
     
      const PiggyBank = await ethers.getContractFactory("PiggyBank");
      const piggyBank = PiggyBank.attach(piggyBankAddress) as PiggyBank;
      
    
      await ethers.provider.send("evm_increaseTime", [lockPeriod1 + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await piggyBank.connect(user1).close();
      
      await expect(piggyBankFactory.connect(user1).removePiggyBank(piggyBankAddress))
        .to.emit(piggyBankFactory, "PiggyBankRemoved")
        .withArgs(user1Address, piggyBankAddress);

      expect(await piggyBankFactory.getUserPiggyBankCount(user1Address)).to.equal(0);
      expect(await piggyBankFactory.getAllPiggyBanks()).to.have.lengthOf(0);
    });

    it("Should not allow non-owner to remove piggy bank", async function () {
      await expect(
        piggyBankFactory.connect(user2).removePiggyBank(piggyBankAddress)
      ).to.be.revertedWith("Piggy bank not found for user");
    });

    it("Should not allow removing non-existent piggy bank", async function () {
      const fakeAddress = "0x1234567890123456789012345678901234567890";
      await expect(
        piggyBankFactory.connect(user1).removePiggyBank(fakeAddress)
      ).to.be.revertedWith("Piggy bank not found for user");
    });
  });

  describe("Admin Functions", function () {
    let piggyBankAddress: string;

    beforeEach(async function () {
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: depositAmount });
      const userPiggyBanks = await piggyBankFactory.getUserPiggyBanks(user1Address);
      piggyBankAddress = userPiggyBanks[0];
    });

    it("Should allow admin to emergency close piggy bank", async function () {
      const PiggyBank = await ethers.getContractFactory("PiggyBank");
      const piggyBank = PiggyBank.attach(piggyBankAddress) as PiggyBank;

      await piggyBankFactory.connect(owner).emergencyClosePiggyBank(piggyBankAddress);
      expect(await piggyBank.isClosed()).to.be.true;
    });

    it("Should not allow non-admin to emergency close", async function () {
      await expect(
        piggyBankFactory.connect(user1).emergencyClosePiggyBank(piggyBankAddress)
      ).to.be.revertedWithCustomError(piggyBankFactory, "OwnableUnauthorizedAccount");
    });

    it("Should allow admin to withdraw fees", async function () {
      
      const PiggyBank = await ethers.getContractFactory("PiggyBank");
      const piggyBank = PiggyBank.attach(piggyBankAddress) as PiggyBank;
      
      await piggyBank.connect(user1).withdraw(ethers.parseEther("0.1"));
      
     
      const balanceBefore = await ethers.provider.getBalance(ownerAddress);
      await piggyBankFactory.connect(owner).withdrawFees(ethers.ZeroAddress, ethers.parseEther("0.003"));
      const balanceAfter = await ethers.provider.getBalance(ownerAddress);
      
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Balance Tracking", function () {
    it("Should track total balance across all piggy banks", async function () {
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: depositAmount });
      await piggyBankFactory.connect(user2).createPiggyBank(lockPeriod2, ethers.ZeroAddress, { value: depositAmount });

      const totalBalance = await piggyBankFactory.getTotalBalance();
      expect(totalBalance).to.equal(depositAmount * 2n);
    });

    it("Should track user balance correctly", async function () {
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod1, ethers.ZeroAddress, { value: depositAmount });
      await piggyBankFactory.connect(user1).createPiggyBank(lockPeriod2, ethers.ZeroAddress, { value: depositAmount });

      const userBalance = await piggyBankFactory.getUserBalance(user1Address);
      expect(userBalance).to.equal(depositAmount * 2n);
    });
  });


  async function getLastCreatedPiggyBank(): Promise<string> {
    const allPiggyBanks = await piggyBankFactory.getAllPiggyBanks();
    return allPiggyBanks[allPiggyBanks.length - 1];
  }
});

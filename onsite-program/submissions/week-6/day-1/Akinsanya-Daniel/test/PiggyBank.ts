import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { ZeroAddress } from "ethers";


describe("PiggyBank", function () {
  
  async function deployPiggyBank() {
    const [owner, otherAccount,admin] = await hre.ethers.getSigners();

    const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
    const PiggyToken = await hre.ethers.getContractFactory("PiggyToken");
    const piggyToken = await PiggyToken.deploy(ethers.parseUnits("1000",18));
  

    const piggyBank = await PiggyBank.deploy(piggyToken.getAddress(), owner.address);

    return { piggyBank, piggyToken, owner, otherAccount ,admin};

  }


  describe("CreateAccount",function(){
    it("Should create account successfully",async function(){
      const {piggyBank} = await loadFixture(deployPiggyBank);

      const name = "Akinsanya";
      const assetType =  0;
      await piggyBank.createAccount(name,assetType,ZeroAddress)
      const getAllAccounts = await piggyBank.getAllAccount();
      expect(getAllAccounts[0].name).to.equal(name);

      })


      it("Should create multiple savings accounts successfully",async function(){
      const {piggyBank,owner} = await loadFixture(deployPiggyBank);

      const name = "Akinsanya";
      const assetType =  1;
      await piggyBank.createAccount(name,assetType,ZeroAddress)
      const name2 = "Akinsanya";
      const assetType2 =  0;
      await piggyBank.createAccount(name2,assetType2,ZeroAddress)
      const name3 = "Akinsanya";
      const assetType3 =  0;
      await piggyBank.createAccount(name3,assetType3,ZeroAddress)
      const getAllAccounts = await piggyBank.getAllAccount();
      expect(getAllAccounts[0].owner).to.equal(owner);
      expect(getAllAccounts[1].owner).to.equal(owner);
      expect(getAllAccounts[2].owner).to.equal(owner);
      

      })
  })


  describe("Deposit Ether",function(){

    it("Should Deposit Ether if assetType is Eth",async function(){
        const {piggyBank,owner} = await loadFixture(deployPiggyBank);
        const name = "Akinsanya";
        const assetType =  0;
        await piggyBank.createAccount(name,assetType,ZeroAddress)
        const getAllAccounts = await piggyBank.getAllAccount();

        console.log(getAllAccounts[0].balance)
        const accountId = getAllAccounts[0].id;

        const lockPeriod = 60;
        await piggyBank.connect(owner).depositEth(accountId,lockPeriod,{
          value: ethers.parseUnits("5",9)
        })
        const getAccount = await piggyBank.getAccount(accountId);


        expect(getAccount.balance).to.equal("5000000000")



    })

    it("Should not deposit eth if the eth is low",async function(){
       const {piggyBank,owner} = await loadFixture(deployPiggyBank);
        const name = "Akinsanya";
        const assetType =  0;
        await piggyBank.createAccount(name,assetType,ZeroAddress)
        const getAllAccounts = await piggyBank.getAllAccount();
        const accountId = getAllAccounts[0].id;

        const lockPeriod = 60;
        await(expect(piggyBank.connect(owner).depositEth(accountId,lockPeriod)).to.be.revertedWithCustomError(piggyBank,"NO_AMOUNT"),{
          value: ethers.parseEther("0")
        })
    })

    it("Should not deposit eth if the asset type is not of that type",async function(){
       const {piggyBank,owner} = await loadFixture(deployPiggyBank);
        const name = "Akinsanya";
        const assetType =  1;
        await piggyBank.createAccount(name,assetType,ZeroAddress)
        const getAllAccounts = await piggyBank.getAllAccount();
        const accountId = getAllAccounts[0].id;

        const lockPeriod = 60;
        await(expect(piggyBank.connect(owner).depositEth(accountId,lockPeriod)).to.be.revertedWithCustomError(piggyBank,"CAN_ONLY_DEPOSIT_ETH"),{
          value: ethers.parseEther("5000")
        })
    })
    })


    describe("Deposit ERC20 Token",function(){
      it("Should deposit ERC20 token if assetType is ERC20",async function(){
        const {piggyBank,piggyToken,owner} = await loadFixture(deployPiggyBank);
        const name = "Akinsanya";
        const assetType =  1;
        await piggyBank.createAccount(name,assetType,piggyToken.getAddress())
        const initialBalance = await piggyToken.balanceOf(owner.address);
        console.log("Owner starting balance:", ethers.formatUnits(initialBalance, 18));

        const getAllAccounts = await piggyBank.getAllAccount();
        const accountId = getAllAccounts[0].id;
        const lockPeriod = 60;
        const depositAmount = ethers.parseUnits("100",18);
        await piggyToken.approve(piggyBank.getAddress(),depositAmount);
        await piggyBank.connect(owner).depositErc20Token(accountId,depositAmount,lockPeriod);
        const getAccount = await piggyBank.getAccount(accountId);
        const finalBalance = await piggyToken.balanceOf(owner.address);
        console.log("Owner final balance:", ethers.formatUnits(finalBalance, 18));

        expect(getAccount.balance).to.equal(depositAmount)
        expect(finalBalance).to.equal(initialBalance - depositAmount)
    })
     it("Should not deposit ERC20 token if assetType is not of that type",async function(){
      const {piggyBank,piggyToken,owner} = await loadFixture(deployPiggyBank);
      const name = "Akinsanya";
      const assetType =  0;
      await piggyBank.createAccount(name,assetType,piggyToken.getAddress())
      const getAllAccounts = await piggyBank.getAllAccount();
      const accountId = getAllAccounts[0].id;
      const lockPeriod = 60;
      const depositAmount = ethers.parseUnits("100",18);
      await piggyToken.approve(piggyBank.getAddress(),depositAmount);
      await(expect(piggyBank.connect(owner).depositErc20Token(accountId,depositAmount,lockPeriod)).to.be.revertedWithCustomError(piggyBank,"CAN_ONLY_DEPOSIT_ERC20TOKEN"))
    })
    it("Should not deposit ERC20 token if amount is zero",async function(){
      const {piggyBank,piggyToken,owner} = await loadFixture(deployPiggyBank);
      const name = "Akinsanya";
      const assetType =  1;
      await piggyBank.createAccount(name,assetType,piggyToken.getAddress())
      const getAllAccounts = await piggyBank.getAllAccount();
      const accountId = getAllAccounts[0].id;
      const lockPeriod = 60;
      const depositAmount = ethers.parseUnits("0",18);
      await piggyToken.approve(piggyBank.getAddress(),depositAmount);
      await(expect(piggyBank.connect(owner).depositErc20Token(accountId,depositAmount,lockPeriod)).to.be.revertedWithCustomError(piggyBank,"NO_AMOUNT"))
    })
  
  })
  describe("Withdraw Ether",function(){
    it("Should withdraw Ether if assetType is Eth",async function(){
      const {piggyBank,owner} = await loadFixture(deployPiggyBank);
      const name = "Akinsanya";
      const assetType =  0;
      await piggyBank.createAccount(name,assetType,ZeroAddress)
      const getAllAccounts = await piggyBank.getAllAccount();
      const accountId = getAllAccounts[0].id;

      const lockPeriod = 60;
      await piggyBank.connect(owner).depositEth(accountId,lockPeriod,{
        value: ethers.parseUnits("5",9)
      })
      const getAccount = await piggyBank.getAccount(accountId);
      console.log(getAccount.balance)

      await time.increase(61);
      await piggyBank.connect(owner).withdtrawEth(accountId,getAccount.balance);

      const getAccountAfterWithdraw = await piggyBank.getAccount(accountId);
      expect(getAccountAfterWithdraw.balance).to.equal("0");

      const ownerBalance = await ethers.provider.getBalance(owner.address);
      console.log("Owner balance after withdraw:", ethers.formatUnits(ownerBalance, 18));
    });

    it("Should not withdraw Ether if assetType is not of that type",async function(){
      const {piggyBank,owner} = await loadFixture(deployPiggyBank);
      const name = "Akinsanya";
      const assetType =  1;
      await piggyBank.createAccount(name,assetType,ZeroAddress)
      const getAllAccounts = await piggyBank.getAllAccount();
      const accountId = getAllAccounts[0].id;

      const lockPeriod = 60;
      const withdrawAmount = ethers.parseUnits("5",9);

      await time.increase(61);
      await(expect(piggyBank.connect(owner).withdtrawEth(accountId,withdrawAmount)).to.be.revertedWithCustomError(piggyBank,"CAN_ONLY_WITHDRAW_ETH"));
    });

    it("Should not withdraw Ether if amount is zero",async function(){
      const {piggyBank,owner} = await loadFixture(deployPiggyBank);
      const name = "Akinsanya";
      const assetType =  0;
      await piggyBank.createAccount(name,assetType,ZeroAddress)
      const getAllAccounts = await piggyBank.getAllAccount();
      const accountId = getAllAccounts[0].id;

      const lockPeriod = 60;
      await piggyBank.connect(owner).depositEth(accountId,lockPeriod,{
        value: ethers.parseUnits("5",9)
      })
      const getAccount = await piggyBank.getAccount(accountId);

      await time.increase(61);
      await(expect(piggyBank.connect(owner).withdtrawEth(accountId,0)).to.be.revertedWithCustomError(piggyBank,"NO_AMOUNT"));
    });

  })
  describe("Withdraw ERC20 Token",function(){
    it("Should withdraw ERC20 token if assetType is ERC20",async function(){
      const {piggyBank,piggyToken,owner} = await loadFixture(deployPiggyBank);
      const name = "Akinsanya";
      const assetType =  1;
      await piggyBank.createAccount(name,assetType,piggyToken.getAddress())
      const initialBalance = await piggyToken.balanceOf(owner.address);
      console.log("Owner starting balance:", ethers.formatUnits(initialBalance, 18));

      const getAllAccounts = await piggyBank.getAllAccount();
      const accountId = getAllAccounts[0].id;
      const lockPeriod = 60;
      const depositAmount = ethers.parseUnits("100",18);
      await piggyToken.approve(piggyBank.getAddress(),depositAmount);
      await piggyBank.connect(owner).depositErc20Token(accountId,depositAmount,lockPeriod);
      const getAccount = await piggyBank.getAccount(accountId);
      console.log(getAccount.balance);

      await time.increase(61);
      await piggyBank.connect(owner).withdtrawErc20(accountId,getAccount.balance);

      const getAccountAfterWithdraw = await piggyBank.getAccount(accountId);
      expect(getAccountAfterWithdraw.balance).to.equal("0");

      const finalBalance = await piggyToken.balanceOf(owner.address);
      console.log("Owner final balance:", ethers.formatUnits(finalBalance, 18));
    });

    it("Should not withdraw ERC20 token if assetType is not of that type",async function(){
      const {piggyBank,piggyToken,owner} = await loadFixture(deployPiggyBank);
      const name = "Akinsanya";
      const assetType =  0;
      await piggyBank.createAccount(name,assetType,piggyToken.getAddress())
      const getAllAccounts = await piggyBank.getAllAccount();
      const accountId = getAllAccounts[0].id;
      const withdrawAmount = ethers.parseUnits("100",18);

      await time.increase(61);
      await(expect(piggyBank.connect(owner).withdtrawErc20(accountId,withdrawAmount)).to.be.revertedWithCustomError(piggyBank,"CAN_ONLY_WITHDRAW_ERC20TOKEN"));
    });

    it("Should not withdraw ERC20 token if amount is zero",async function(){
      const {piggyBank,piggyToken,owner} = await loadFixture(deployPiggyBank);
      const name = "Akinsanya";
      const assetType =  1;
      await piggyBank.createAccount(name,assetType,piggyToken.getAddress())
      const getAllAccounts = await piggyBank.getAllAccount();
      const accountId = getAllAccounts[0].id;

      const lockPeriod = 60;
      const depositAmount = ethers.parseUnits("100",18);
      await piggyToken.approve(piggyBank.getAddress(),depositAmount);
      await piggyBank.connect(owner).depositErc20Token(accountId,depositAmount,lockPeriod);
      const getAccount = await piggyBank.getAccount(accountId);

      await time.increase(61);
      await(expect(piggyBank.connect(owner).withdtrawErc20(accountId,0)).to.be.revertedWithCustomError(piggyBank,"NO_AMOUNT"));
    });

    
  
  })
});
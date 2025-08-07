import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";

describe("ERC-20 Token", function () {
 
  async function deployERC20() {
   
    // Contracts are deployed using the first signer/account by default
    const [owner, spender, recipient] = await hre.ethers.getSigners();

    const TOKEN = await hre.ethers.getContractFactory("CHILD_TOKEN");
    const FACTORY =  await hre.ethers.getContractFactory("ERC_20_FACTORY")
    const token = await TOKEN.deploy("IBADAN", "IBD", owner.address);
    const factory = await FACTORY.deploy();

   
    return { token, factory, owner, spender, recipient };
  }

  describe("Deployment", function () {
    it("Should get the right token name", async function () {
      const { token } = await loadFixture(deployERC20);
      console.log(token.name())
      expect(await token.name()).to.equal("IBADAN");
    });

    it("Should get the right symbol", async function () {
      const { token } = await loadFixture(deployERC20);
      expect(await token.symbol()).to.equal("IBD");
    });

    it("Should get the right decimals", async function () {
      const { token } = await loadFixture(deployERC20);
      expect(await token.decimals()).to.equal(16);
    });    

    it("Should get the right total supply", async function () {
      const { token } = await loadFixture(deployERC20);
      expect(await token.totalSupply()).to.equal(10000000000000000000000000n);
    });

    it ("should deploy the child contract", async function(){
      const { factory, token } = await loadFixture(deployERC20);
      await factory.create_erc_20_contract("NEW_TOKEN", "NT");
      expect(await factory.name(0)).to.be.equal("NEW_TOKEN")
    })

   it("should get the contract address of the child contract", async function () {
  const { factory } = await loadFixture(deployERC20);

  const tx = await factory.create_erc_20_contract("NEW_TOKEN", "NT");
  await tx.wait();

  const childAddress = await factory.getContractAddress();

  expect(childAddress).to.properAddress;

  const childToken = await hre.ethers.getContractAt("CHILD_TOKEN", childAddress);
  expect(await childToken.symbol()).to.equal("NT");
});


  });

  describe("Balance", function () {
    
    it("Balance in deployers address should be equal to total supply on deployment", async function () {
        const { token, owner } = await loadFixture(deployERC20);
        expect(await token.balanceOf(owner.address)).to.equal(10000000000000000000000000n)
    })

     it("Balance should be zero if no token or number token is zero", async function () {
        const { token, owner, spender } = await loadFixture(deployERC20);
        expect(await token.balanceOf(spender.address)).to.equal(0n)
    })

    it("For the child contract balance of the EOA should be equal to the total supply on deployment", async function () {
        const {token, factory, owner} =  await loadFixture(deployERC20);
        await factory.create_erc_20_contract("NEW_TOKEN", "NWT");
        expect(await factory.balanceOf(owner,0)).to.be.equal(10000000000000000000000000n);
    })

    it("For the child contract balance of the EOA should be zero if no token or number token is zero", async function () {
        const {token, factory, owner} =  await loadFixture(deployERC20);
        await factory.create_erc_20_contract("NEW_TOKEN", "NWT");
        expect(await factory.balanceOf(owner,0)).to.be.equal(10000000000000000000000000n);
    })


  });

  describe("Transfer", function(){

    it("Revert if amount is more than balance", async function () {
        const {token, owner, spender} = await loadFixture(deployERC20)
        await expect(token.connect(spender).transfer(owner.address, 100)).to.be.revertedWithCustomError(token, "InsufficientBalance")
    })

    it("should send token to another address", async function () {
        const {token, owner,  recipient} = await loadFixture(deployERC20)
        await token.transfer(recipient.address, 5000);
        expect(await token.balanceOf(recipient.address)).to.be.equal(5000)
    })

    it("should send token to another address", async function () {
        const {factory, owner,  recipient} = await loadFixture(deployERC20)
        await factory.create_erc_20_contract("NEW_TOKEN", "NWT");
        console.log(await factory.balanceOf(owner.address, 0))
        await factory.transfer(recipient.address, 5000, 0);
        expect(await factory.balanceOf(recipient.address,0)).to.be.equal(5000)
    })

    
    
  })

  describe("Approve and Allowance", function(){
     it("approve should return true if successful", async function () {
        const {token, owner,spender,  recipient} = await loadFixture(deployERC20)
        expect(await token.approve.staticCall(spender.address, 5000)).to.be.true

    })

    it("allowance should return amount approved", async function () {
        const {token, owner,spender,  recipient} = await loadFixture(deployERC20)
        await token.approve(spender.address, 5000)
        expect(await token.allowance(owner.address, spender.address)).to.be.equal(5000)

    })
  })

  describe("TransferFrom", function(){
    it("Transfer if spender is allowed", async function () {
        const {token, owner,spender,  recipient} = await loadFixture(deployERC20)
       
        await token.approve(spender.address, 5000)
       
        
    await token.connect(spender).transferFrom(owner.address, recipient.address, 3000)
        
        expect(await token.balanceOf(recipient.address)).to.be.equal(3000)

    })

      it("revert if spender is not allowed", async function () {
        const {token, owner,spender,  recipient} = await loadFixture(deployERC20)        
        
      await  expect(token.connect(spender).transferFrom(owner.address, recipient.address, 3000)).to.be.revertedWithCustomError(token, 'UNAUTHORIZED')

    })


    it("revert if amount spent is more than the approved amiunt", async function () {
        
       const {token, owner,spender,  recipient} = await loadFixture(deployERC20)
       
        await token.approve(spender.address, 2000)
       
        
    await  expect(token.connect(spender).transferFrom(owner.address, recipient.address, 3000)).to.be.revertedWithCustomError(token, 'ExceedsLimit')

        

    })
  })


  
});

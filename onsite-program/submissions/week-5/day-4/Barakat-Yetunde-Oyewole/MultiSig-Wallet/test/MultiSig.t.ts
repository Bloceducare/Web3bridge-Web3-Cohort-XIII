import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSig, MultiSigFactory } from "../typechain-types";

const { assert } = require('chai');

describe('MultiSig', function () {
    let contract;
    let accounts;
    
    beforeEach(async () => {
        const signers = await ethers.getSigners();
        accounts = signers.map(s => s.address);
        const MultiSig = await ethers.getContractFactory("MultiSig");
        contract = await MultiSig.deploy(accounts.slice(0, 3), 1);
        await contract.waitForDeployment();
    });

    describe('storing ERC20 tokens', function () {
        const initialBalance = 10000;
        let token;

        beforeEach(async () => {
            // Try EIP20 first, fallback to a simple ERC20 if not available
            try {
                const EIP20 = await ethers.getContractFactory("EIP20");
                token = await EIP20.deploy(initialBalance, 'My Token', 1, 'MT');
            } catch (error) {
                // Fallback: Create a simple ERC20 contract inline
                const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
                token = await SimpleERC20.deploy("My Token", "MT", initialBalance);
            }
            await token.waitForDeployment();
            await token.transfer(await contract.getAddress(), initialBalance);
        });

        it('should store the balance', async () => {
            const balance = await token.balanceOf(await contract.getAddress());
            assert.equal(Number(balance), initialBalance);
        });

        describe('executing an ERC20 transaction', function () {
            beforeEach(async () => {
                const data = token.interface.encodeFunctionData("transfer", [accounts[2], initialBalance]);
                await contract.submitTransaction(await token.getAddress(), 0, data);
            });

            it('should have removed the contract balance', async () => {
                const balance = await token.balanceOf(await contract.getAddress());
                assert.equal(Number(balance), 0);
            });

            it('should have moved the balance to the destination', async () => {
                const balance = await token.balanceOf(accounts[2]);
                assert.equal(Number(balance), initialBalance);
            });
        });
    });

    describe('storing ether', function () {
        const oneEther = ethers.parseEther("1");
        
        beforeEach(async () => {
            const signer = await ethers.provider.getSigner(0);
            await signer.sendTransaction({ 
                to: await contract.getAddress(), 
                value: oneEther 
            });
        });

        it('should store the balance', async () => {
            const balance = await ethers.provider.getBalance(await contract.getAddress());
            assert.equal(balance.toString(), oneEther.toString());
        });

        describe('executing the ether transaction', function () {
            let balanceBefore;

            beforeEach(async () => {
                balanceBefore = await ethers.provider.getBalance(accounts[1]);
                await contract.submitTransaction(accounts[1], oneEther, "0x");
            });

            it('should have removed the contract balance', async () => {
                const balance = await ethers.provider.getBalance(await contract.getAddress());
                assert.equal(Number(balance), 0);
            });

            it('should have moved the balance to the destination', async () => {
                const balance = await ethers.provider.getBalance(accounts[1]);
                const difference = balance - balanceBefore;
                assert.equal(difference.toString(), oneEther.toString());
            });
        });
    });
});
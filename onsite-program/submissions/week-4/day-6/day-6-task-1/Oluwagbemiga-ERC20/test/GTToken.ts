import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("GTToken Deployment", function() {
    async function deployToken() {
        // The signers of the token are to be gotten -> an address.
        const [addr, addr2, balance, allowance] = await hre.ethers.getSigners();
        // we get the addresses that are involved within the transaction of the token.

        const GTToken = hre.ethers.getContractFactory("GTToken");
        
        /**This will resolve to the Contract before it has been deployed to the network, so the [[BaseContract-waitForDeployment]] should be used before sending any transactions to it. */ 
        const gt_token = (await GTToken).deploy();

        return { addr, addr2, balance, allowance, gt_token };
    }

    describe("Token Creation", function() {
        it("should create a token", async () => {
            /**Warning: don't use loadFixture with an anonymous function, otherwise the function will be executed each time instead of using snapshot */
            // const {gt_token} = await loadFixture(deployToken);

            const initialValue = 1_000_000_000 // one million gwei in tokens.

            const name = "Demo Token";
            const symbol = "DT";
            const decimal = 14;

            // we might need not to test for the creation of a token since our contract uses a constructor.
        })

        /**Describe a specification or test-case with the given callback fn acting as a thunk. The name of the function is used as the name of the test. */
        it("should set the total supply of the token", async () => {
            
        })
    })

    describe("Token Transfer", function() {
        it("should transfer a token", async () => {
            const {addr, addr2, gt_token} = await loadFixture(deployToken);

            const _to = addr;
            const value = 100;

            await gt_token.transfer(_to, value);
        })

        // it("should check for the balance of an address", async () => {})
    })
})
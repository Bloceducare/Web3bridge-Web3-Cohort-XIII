import { expect } from "chai";
import { ethers } from "hardhat";
import { SMSFactory } from "../typechain-types";


describe("SMSFactory", async () => {
    it("should deploy successfully", async () => {
        const instance = await ethers.deployContract("SMSFactory");
        await instance.waitForDeployment();

        expect(await instance.pingSMS("hello")).to.equal('hello')
    })
})
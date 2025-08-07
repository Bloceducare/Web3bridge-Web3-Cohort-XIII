import { ethers } from "hardhat"
import { expect } from "chai";

describe("ERC20Factory", async () => {
    it("should deploy ERC20 successfully", async () => {
        const factory = await ethers.getContractFactory("ERC20");
        const name = "Praise";
        const symbol = "PR";
        const decimals = 18
        const instance = await factory.deploy(name, symbol, decimals);

        expect(await instance.name()).to.equal(name)
        expect(await instance.symbol()).to.equal(symbol);
        expect(await instance.decimals()).to.equal(decimals);
    });
})
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Contract } from "ethers";
import { Signer } from "ethers";

describe("ERC20 functionality testing", function () {
    let contract: Contract;
    let owner: Signer;
    let name = "Rafikki";
    const tokenSymbol = "RFK";
    let totalSupply = 100_000_000;
    const tokenDecimals = 18;

    async function deployFactory() {
        const factory = await hre.ethers.getContractFactory("ERC20Factory");
        [owner] = await hre.ethers.getSigners();
        contract = await factory.deploy();
        await contract.waitForDeployment();
        return { contract, owner };
    }
    
    describe("tests instance creation", () => {
        it("tests contract creations", async () => { 
            const { contract } = await loadFixture(deployFactory);
            const contractAddress = await contract.createToken(name, tokenSymbol, totalSupply, tokenDecimals);
            expect((await contract.getAllTokens()).length).to.equal(1);
        })
    });
  }
);
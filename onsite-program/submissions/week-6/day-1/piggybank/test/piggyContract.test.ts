import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import hre from "hardhat";
import { expect } from "chai";

enum AccountTypes{DEFAULT,ETHERS,ERC20}

describe("piggy wallet factory", () => {
    async function deployContract() {
        const [admin, user1, user2, user3] = await hre.ethers.getSigners();
        const contract = await hre.ethers.getContractFactory("PiggyFactory");
        const token = await hre.ethers.getContractFactory("TestToken")
        const deployedToken = await token.connect(admin).deploy("TestToken", "TTK", 18, 500);
        const deployedContract = await contract.connect(admin).deploy();
        await deployedToken.connect(admin).transfer(user1.address, 10);
        return { deployedContract, admin, user1, user2, user3, deployedToken };
    }
}
)
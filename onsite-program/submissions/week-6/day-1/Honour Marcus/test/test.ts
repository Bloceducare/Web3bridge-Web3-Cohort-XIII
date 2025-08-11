const { expect } = require("chai");
const { ethers } = require("hardhat");
c

describe("PiggyBank", function () {

    it("Should deposit ETH with unique lock period", async function () {
        const [factoryOwner, user] = await ethers.getSigners();

        const PiggyBank = await ethers.getContractFactory("PiggyBank");
        const piggyBank = await PiggyBank.deploy(user.address, factoryOwner.address);

        const lockPeriod = 60;
        await expect(
            piggyBank.connect(user).depositETH(lockPeriod, { value: ethers.parseEther("1") })
        ).to.emit(piggyBank, "Deposit");

        const plan = await piggyBank.plans(0);
        expect(plan.amount).to.equal(ethers.parseEther("1"));
    });

    it("Should fail if lock period already exists", async function () {
        const [factoryOwner, user] = await ethers.getSigners();

        const PiggyBank = await ethers.getContractFactory("PiggyBank");
        const piggyBank = await PiggyBank.deploy(user.address, factoryOwner.address);

        const lockPeriod = 60;
        await piggyBank.connect(user).depositETH(lockPeriod, { value: ethers.parseEther("1") });

        await expect(
            piggyBank.connect(user).depositETH(lockPeriod, { value: ethers.parseEther("1") })
        ).to.be.revertedWith("Lock period must be unique");
    });

    it("Should deposit ERC20 tokens", async function () {
        const [factoryOwner, user] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("ERC20Mock");
        const token = await Token.deploy("MockToken", "MTK", user.address, ethers.parseEther("1000"));

        const PiggyBank = await ethers.getContractFactory("PiggyBank");
        const piggyBank = await PiggyBank.deploy(user.address, factoryOwner.address);

        const lockPeriod = 120;
        await token.connect(user).approve(piggyBank.target, ethers.parseEther("10"));
        await expect(
            piggyBank.connect(user).depositToken(token.target, ethers.parseEther("10"), lockPeriod)
        ).to.emit(piggyBank, "Deposit");

        const plan = await piggyBank.plans(0);
        expect(plan.tokenAddress).to.equal(token.target);
        expect(plan.amount).to.equal(ethers.parseEther("10"));
    });

    it("Should withdraw ETH after lock period without fee", async function () {
        const [factoryOwner, user] = await ethers.getSigners();

        const PiggyBank = await ethers.getContractFactory("PiggyBank");
        const piggyBank = await PiggyBank.deploy(user.address, factoryOwner.address);

        const lockPeriod = 2;
        await piggyBank.connect(user).depositETH(lockPeriod, { value: ethers.parseEther("1") });

        await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
        await ethers.provider.send("evm_mine");

        const beforeBal = await ethers.provider.getBalance(user.address);
        await piggyBank.connect(user).withdraw(0);
        const afterBal = await ethers.provider.getBalance(user.address);

        expect(afterBal).to.be.gt(beforeBal);
    });

    it("Should withdraw ERC20 before lock period with fee", async function () {
        const [factoryOwner, user] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("ERC20Mock");
        const token = await Token.deploy("MockToken", "MTK", user.address, ethers.parseEther("1000"));

        const PiggyBank = await ethers.getContractFactory("PiggyBank");
        const piggyBank = await PiggyBank.deploy(user.address, factoryOwner.address);

        const lockPeriod = 100;
        await token.connect(user).approve(piggyBank.target, ethers.parseEther("10"));
        await piggyBank.connect(user).depositToken(token.target, ethers.parseEther("10"), lockPeriod);

        await piggyBank.connect(user).withdraw(0);

        const fee = await token.balanceOf(factoryOwner.address);
        expect(fee).to.equal(ethers.parseEther("0.3")); // 3% fee
    });
});

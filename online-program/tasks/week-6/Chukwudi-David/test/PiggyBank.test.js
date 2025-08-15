const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {

  async function deployPiggyBank() {

    const [owner, saver] = await ethers.getSigners();

    // Deploy mock ERC20
    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy();
    await token.mint(saver.address, ethers.parseEther("1000"))

    // Deploy factory
    const Factory = await ethers.getContractFactory("PiggyBankFactory");
    const factory = await Factory.deploy(owner);

    // Create a piggy bank for `user`
    const lockPeriod = 60 * 60 * 24; // 1 day
    await factory.createPiggyBank(saver.address, lockPeriod);
    const piggyAddr = await factory.getPiggyBanks(saver.address)
    const piggyBank = await ethers.getContractAt("PiggyBank", piggyAddr[0]);

    return { factory, piggyBank, owner, saver, token, lockPeriod };
  }

  describe("PiggyBankFactory", function () {
    it("should create PiggyBank with correct owner and lock period", async function () {

        const { piggyBank, lockPeriod, saver } = await loadFixture(deployPiggyBank);
        
        expect(await piggyBank.saver()).to.equal(saver.address);
        expect(await piggyBank.lockPeriod()).to.equal(lockPeriod);

    });

    it("should allow factory owner to withdraw ETH", async function () {
        const { owner, factory } = await loadFixture(deployPiggyBank);
 
        await owner.sendTransaction({ to: factory.target, value: ethers.parseEther("2") });
        await expect(() =>
            factory.withdrawETH(ethers.parseEther("1"))
        ).to.changeEtherBalances(
            [owner],
            [ethers.parseEther("1")]
        );
    });


    it("should allow factory owner to withdraw ERC20", async function () {

        const { factory, saver, owner, token } = await loadFixture(deployPiggyBank);

        await token.connect(saver).transfer(factory.target, ethers.parseEther("5"));
        await expect(() =>
            factory.withdrawToken(token.target, ethers.parseEther("5"))
        ).to.changeTokenBalances(
            token,
            [factory, owner],
            [ethers.parseEther("-5"), ethers.parseEther("5")]
        );
    });

    it("should track totalBalanceOf across piggybanks", async function () {

        const { factory, saver, piggyBank} = await loadFixture(deployPiggyBank);

        await piggyBank.connect(saver).depositETH({ value: ethers.parseEther("1") });
        const total = await factory.totalBalanceOf(saver.address, ethers.ZeroAddress);
        expect(total).to.equal(ethers.parseEther("1"));
    });


  });

  describe("PiggyBank", function () {

    it("should allow ETH deposit and update saved tokens list", async function () {
        const { piggyBank, saver } = await loadFixture(deployPiggyBank);

        await piggyBank.connect(saver).depositETH({ value: ethers.parseEther("1") });
        expect(await piggyBank.balanceOf(ethers.ZeroAddress)).to.equal(ethers.parseEther("1"));
        const savedTokens = await piggyBank.getSavedTokens();
        expect(savedTokens).to.include(ethers.ZeroAddress);
    });

    it("should allow ERC20 deposit and track token", async function () {
        const { piggyBank, token, saver } = await loadFixture(deployPiggyBank);

        await token.connect(saver).approve(piggyBank.target, ethers.parseEther("10"));
        await piggyBank.connect(saver).depositERC20(token.target, ethers.parseEther("10"));
        expect(await piggyBank.balanceOf(token.target)).to.equal(ethers.parseEther("10"));
        const savedTokens = await piggyBank.getSavedTokens();
        expect(savedTokens).to.include(token.target);
    });

    it("should not allow withdraw before lock without paying fee", async function () {
        const { piggyBank, saver, factory } = await loadFixture(deployPiggyBank);

        await piggyBank.connect(saver).depositETH({ value: ethers.parseEther("1") });

        const fee = ethers.parseEther("1") * 300n / 10000n;
        const expectedPayout = ethers.parseEther("1") - fee;

        await expect(() =>
            piggyBank.connect(saver).withdraw(ethers.ZeroAddress, ethers.parseEther("1"))
        ).to.changeEtherBalances(
            [saver, factory],
            [expectedPayout, fee]
        );
    });

    it("should allow withdrawAllAfterLock with no fee", async function () {
        const { piggyBank, saver } = await loadFixture(deployPiggyBank);

        await piggyBank.connect(saver).depositETH({ value: ethers.parseEther("1") });

        await ethers.provider.send("evm_increaseTime", [60 * 60 * 24 + 1]);
        await ethers.provider.send("evm_mine");

        await expect(() =>
            piggyBank.connect(saver).withdrawAllAfterLock(ethers.ZeroAddress)
        ).to.changeEtherBalances(
            [saver],
            [ethers.parseEther("1")]
        );
    });

    
  });
});

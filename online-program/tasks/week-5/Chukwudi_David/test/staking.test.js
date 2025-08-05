const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Staking", function () {

  async function deployStake() {

    const ONE_MIN = 60;

    const lockPeriod = (await time.latest()) + ONE_MIN;

    [owner, user] = await ethers.getSigners();

    TokenA = await ethers.getContractFactory("TokenA");
    tokenA = await TokenA.deploy();

    TokenB = await ethers.getContractFactory("TokenB");
    tokenB = await TokenB.deploy();

    await tokenA.mint(owner.address, ethers.parseEther("1000"));
    await tokenA.mint(user.address, ethers.parseEther("1000"));

    Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(tokenB.target, lockPeriod);

    return { staking, tokenA, tokenB, lockPeriod, user};

  }

  describe("Deployment", function () {
    it("Should set constructor parameters right", async function () {
      const { staking, tokenB, lockPeriod } = await loadFixture(deployStake);

      expect(await staking.lockPeriod()).to.equal(lockPeriod);
      expect(await staking.tokenB()).to.equal(tokenB);

    });

  });

  describe("Test Staking Part", function () {

      it("should allow a user to stake TokenA and receive TokenB", async () => {

        const { staking, tokenA, user } = await loadFixture(deployStake);

        const amount = ethers.parseEther("100");
        await tokenA.connect(user).approve(staking.target, amount);
    
        await expect(staking.connect(user).stake(user.address, tokenA.target, amount))
      .to.emit(staking, "Staked");
    
        const stakeDetails = await staking.getStakeDetails(user.address, tokenA.target);
        expect(stakeDetails.amount).to.equal(amount);
    
        const userTokenBBalance = await tokenB.balanceOf(user.address);
        expect(userTokenBBalance).to.equal(amount);
      });
  });

  describe("Test Unstaking Part", function () {

      it("should not allow unstaking before lock period", async () => {
        const { staking, tokenA, user } = await loadFixture(deployStake);

        const amount = ethers.parseEther("100");
        await tokenA.connect(user).approve(staking.target, amount);
        await staking.connect(user).stake(user.address, tokenA.target, amount);

        console.log("In hereee")
    
        await expect(
          staking.connect(user).unstake(user.address, tokenA.target, amount)
        ).to.be.revertedWith("Still locked");
      });
  })
});

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

    Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(tokenB.target, lockPeriod);

    return { staking, tokenA, tokenB, lockPeriod, user};

  }

  // describe("Deployment", function () {
  //   it("Should set the right unlockTime", async function () {
  //     const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });

  //   it("Should set the right owner", async function () {
  //     const { lock, owner } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.owner()).to.equal(owner.address);
  //   });

  //   it("Should receive and store the funds to lock", async function () {
  //     const { lock, lockedAmount } = await loadFixture(
  //       deployOneYearLockFixture
  //     );

  //     expect(await ethers.provider.getBalance(lock.target)).to.equal(
  //       lockedAmount
  //     );
  //   });

  //   it("Should fail if the unlockTime is not in the future", async function () {
  //     // We don't use the fixture here because we want a different deployment
  //     const latestTime = await time.latest();
  //     const Lock = await ethers.getContractFactory("Lock");
  //     await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
  //       "Unlock time should be in the future"
  //     );
  //   });
  // });

  describe("Test Staking Contract", function () {

      it("should allow a user to stake TokenA and receive TokenB", async () => {

        const { staking, tokenA, user } = await loadFixture(deployStake);

        const amount = ethers.parseEther("100");
        await tokenA.connect(user).approve(staking.address, amount);
        console.log(tokenA.target)
    
        await expect(staking.connect(user).stake(user.address, tokenA.target, amount))
          .to.emit(staking, "Staked");
    
        const stakeDetails = await staking.getStakeDetails(user.address, tokenA.address);
        expect(stakeDetails.amount).to.equal(amount);
    
        const userTokenBBalance = await tokenB.balanceOf(user.address);
        expect(userTokenBBalance).to.equal(amount);
      });
  });
});

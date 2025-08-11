import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { time } from '@nomicfoundation/hardhat-network-helpers'

describe('PiggyBank System', () => {
  async function deployPiggyBank() {
    const [owner, user1, user2] = await hre.ethers.getSigners()

    // Deploy the factory
    const PiggyBankFactory = await hre.ethers.getContractFactory('PiggyBankFactory')
    const piggyBankFactory = await PiggyBankFactory.deploy()
    await piggyBankFactory.waitForDeployment()

    return { piggyBankFactory, owner, user1, user2 }
  }

  async function deployWithPiggyBank() {
    const { piggyBankFactory, owner, user1, user2 } = await loadFixture(deployPiggyBank)

    // Create a piggy bank for user1
    const tx = await piggyBankFactory.connect(user1).createPiggyBank()
    await tx.wait()

    const piggyBankAddress = await piggyBankFactory.getUserPiggyBank(user1.address)
    const piggyBank = await hre.ethers.getContractAt('PiggyBank', piggyBankAddress)

    return { piggyBankFactory, piggyBank, owner, user1, user2 }
  }

  describe('Factory Deployment', () => {
    it('Should deploy the PiggyBankFactory contract', async () => {
      const { piggyBankFactory, owner } = await loadFixture(deployPiggyBank)

      expect(await piggyBankFactory.getAddress()).to.not.be.null
      expect(await piggyBankFactory.admin()).to.equal(owner.address)
    })

    it('Should create a new Piggy Bank for user', async () => {
      const { piggyBankFactory, user1 } = await loadFixture(deployPiggyBank)

      const tx = await piggyBankFactory.connect(user1).createPiggyBank()
      await tx.wait()

      const piggyBankAddress = await piggyBankFactory.getUserPiggyBank(user1.address)
      const piggyBank = await hre.ethers.getContractAt('PiggyBank', piggyBankAddress)

      expect(await piggyBank.owner()).to.equal(user1.address)
      expect(await piggyBank.factory()).to.equal(await piggyBankFactory.getAddress())
    })

    it('Should prevent creating multiple piggy banks for same user', async () => {
      const { piggyBankFactory, user1 } = await loadFixture(deployPiggyBank)

      await piggyBankFactory.connect(user1).createPiggyBank()

      await expect(piggyBankFactory.connect(user1).createPiggyBank()).to.be.revertedWith(
        'Already has piggybank'
      )
    })
  })

  describe('Savings Plans', () => {
    it('Should create ETH savings plan', async () => {
      const { piggyBank, user1 } = await loadFixture(deployWithPiggyBank)

      const depositAmount = hre.ethers.parseEther('1')

      await piggyBank.connect(user1).create_savings_account(
        hre.ethers.ZeroAddress, // ETH
        0,
        0, // WEEKLY
        { value: depositAmount }
      )

      const plans = await piggyBank.getUserSavingsPlans(user1.address)
      expect(plans.length).to.equal(1)
      expect(plans[0].amount).to.equal(depositAmount)
      expect(plans[0].token).to.equal(hre.ethers.ZeroAddress)
      expect(plans[0].active).to.be.true
    })

    it('Should prevent duplicate lock periods', async () => {
      const { piggyBank, user1 } = await loadFixture(deployWithPiggyBank)

      const depositAmount = hre.ethers.parseEther('1')

      // Create first plan
      await piggyBank.connect(user1).create_savings_account(
        hre.ethers.ZeroAddress,
        0,
        0, // WEEKLY
        { value: depositAmount }
      )

      // Try to create another weekly plan
      await expect(
        piggyBank.connect(user1).create_savings_account(
          hre.ethers.ZeroAddress,
          0,
          0, // WEEKLY again
          { value: depositAmount }
        )
      ).to.be.revertedWith('Already have savings with this lock period')
    })

    it('Should allow different lock periods', async () => {
      const { piggyBank, user1 } = await loadFixture(deployWithPiggyBank)

      const depositAmount = hre.ethers.parseEther('1')

      // Create weekly plan
      await piggyBank.connect(user1).create_savings_account(
        hre.ethers.ZeroAddress,
        0,
        0, // WEEKLY
        { value: depositAmount }
      )

      // Create monthly plan
      await piggyBank.connect(user1).create_savings_account(
        hre.ethers.ZeroAddress,
        0,
        1, // MONTHLY
        { value: depositAmount }
      )

      const plans = await piggyBank.getUserSavingsPlans(user1.address)
      expect(plans.length).to.equal(2)
    })
  })

  describe('Withdrawals', () => {
    it('Should apply penalty for early withdrawal', async () => {
      const { piggyBankFactory, piggyBank, owner, user1 } = await loadFixture(deployWithPiggyBank)

      const depositAmount = hre.ethers.parseEther('1')

      await piggyBank.connect(user1).create_savings_account(
        hre.ethers.ZeroAddress,
        0,
        1, // MONTHLY (30 days)
        { value: depositAmount }
      )

      const initialAdminBalance = await hre.ethers.provider.getBalance(owner.address)
      const initialUserBalance = await hre.ethers.provider.getBalance(user1.address)

      // Withdraw early (before 30 days)
      const tx = await piggyBank.connect(user1).withdraw(0)
      const receipt = await tx.wait()
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice

      const finalAdminBalance = await hre.ethers.provider.getBalance(owner.address)
      const finalUserBalance = await hre.ethers.provider.getBalance(user1.address)

      const expectedPenalty = (depositAmount * 3n) / 100n // 3%
      const expectedUserReceived = depositAmount - expectedPenalty

      // Check admin received penalty
      expect(finalAdminBalance - initialAdminBalance).to.equal(expectedPenalty)

      // Check user received correct amount (accounting for gas)
      const userNetChange = finalUserBalance - initialUserBalance + gasUsed
      expect(userNetChange).to.equal(expectedUserReceived)
    })

    it('Should pay principal after completed lock period (interest requires separate funding)', async () => {
      const { piggyBank, user1 } = await loadFixture(deployWithPiggyBank)

      const depositAmount = hre.ethers.parseEther('1')

      await piggyBank.connect(user1).create_savings_account(
        hre.ethers.ZeroAddress,
        0,
        0, // WEEKLY (7 days)
        { value: depositAmount }
      )

      // Fast forward 8 days
      await time.increase(8 * 24 * 60 * 60)

      const initialBalance = await hre.ethers.provider.getBalance(user1.address)

      const tx = await piggyBank.connect(user1).withdraw(0)
      const receipt = await tx.wait()
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice

      const finalBalance = await hre.ethers.provider.getBalance(user1.address)

      // User should get back at least their principal
      const userNetChange = finalBalance - initialBalance + gasUsed
      expect(userNetChange).to.be.gte(depositAmount)
    })
  })

  describe('Balance Tracking', () => {
    it('Should track user balances correctly', async () => {
      const { piggyBankFactory, piggyBank, user1 } = await loadFixture(deployWithPiggyBank)

      const depositAmount = hre.ethers.parseEther('2')

      // Create two different savings plans
      await piggyBank.connect(user1).create_savings_account(
        hre.ethers.ZeroAddress,
        0,
        0, // WEEKLY
        { value: hre.ethers.parseEther('1') }
      )

      await piggyBank.connect(user1).create_savings_account(
        hre.ethers.ZeroAddress,
        0,
        1, // MONTHLY
        { value: hre.ethers.parseEther('1') }
      )

      const [ethBalance] = await piggyBankFactory.getUserBalance(user1.address)
      expect(ethBalance).to.equal(depositAmount)

      const planCount = await piggyBankFactory.getUserSavingsCount(user1.address)
      expect(planCount).to.equal(2)
    })
  })
})

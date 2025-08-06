import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('MyERC20Token', function () {
  async function deployMyErc20TokenFixture() {
    const [owner, user1, user2, user3] = await hre.ethers.getSigners()

    const MyERC20Token = await hre.ethers.getContractFactory('MyERC20Token')
    const erc20 = await MyERC20Token.deploy('BunCoin', 'BUN', 18, 1000)

    return {
      erc20,
      owner,
      user1,
      user2,
      user3,
      initialSupply: 1000n,
      decimals: 18n
    }
  }

  describe('Deployment', function () {
    it('should set the correct token metadata', async function () {
      const { erc20 } = await loadFixture(deployMyErc20TokenFixture)

      expect(await erc20.name()).to.equal('BunCoin')
      expect(await erc20.symbol()).to.equal('BUN')
      expect(await erc20.decimal()).to.equal(18)
    })

    it('should mint initial supply to owner', async function () {
      const { erc20, owner, initialSupply, decimals } = await loadFixture(deployMyErc20TokenFixture)

      const expectedSupply = initialSupply * 10n ** decimals

      expect(await erc20.totalSupply()).to.equal(expectedSupply)

      expect(await erc20.balanceOf(owner.address)).to.equal(expectedSupply)
    })

    it('should set the deployer as owner', async function () {
      const { erc20, owner } = await loadFixture(deployMyErc20TokenFixture)

      await expect(erc20.connect(owner).mint(owner.address, 100)).not.to.be.reverted
    })
  })

  describe('Transfers', function () {
    describe('transfer', function () {
      it('should transfer tokens between accounts', async function () {
        const { erc20, owner, user1 } = await loadFixture(deployMyErc20TokenFixture)
        const transferAmount = 100n * 10n ** 18n

        // Get initial balances
        const ownerBalanceBefore = await erc20.balanceOf(owner.address)
        const user1BalanceBefore = await erc20.balanceOf(user1.address)

        await erc20.connect(owner).transfer(user1.address, transferAmount)

        expect(await erc20.balanceOf(owner.address)).to.equal(ownerBalanceBefore - transferAmount)
        expect(await erc20.balanceOf(user1.address)).to.equal(user1BalanceBefore + transferAmount)
      })

      it('should handle zero amount transfers', async function () {
        const { erc20, owner, user1 } = await loadFixture(deployMyErc20TokenFixture)

        // Zero transfer should not revert
        await expect(erc20.connect(owner).transfer(user1.address, 0)).not.to.be.reverted

        // Balances should be unchanged
        expect(await erc20.balanceOf(user1.address)).to.equal(0)
      })

      it('should revert when transferring to zero address', async function () {
        const { erc20, owner } = await loadFixture(deployMyErc20TokenFixture)

        await expect(
          erc20.connect(owner).transfer('0x0000000000000000000000000000000000000000', 100)
        ).to.be.revertedWithCustomError(erc20, 'ZeroAddress')
      })

      it('should revert when sender has insufficient balance', async function () {
        const { erc20, user1, user2 } = await loadFixture(deployMyErc20TokenFixture)

        // user1 has no tokens, should fail
        await expect(
          erc20.connect(user1).transfer(user2.address, 100)
        ).to.be.revertedWithCustomError(erc20, 'InsufficientBalance')
      })

      it('should revert when transferring more than balance', async function () {
        const { erc20, owner, user1 } = await loadFixture(deployMyErc20TokenFixture)
        const totalSupply = await erc20.totalSupply()

        await expect(
          erc20.connect(owner).transfer(user1.address, totalSupply + 1n)
        ).to.be.revertedWithCustomError(erc20, 'InsufficientBalance')
      })
    })

    describe('transferFrom', function () {
      it('should transfer tokens using allowance', async function () {
        const { erc20, owner, user1, user2 } = await loadFixture(deployMyErc20TokenFixture)
        const transferAmount = 100n * 10n ** 18n // 100 tokens with 18 decimals

        // Setup: owner approves user1 to spend tokens
        await erc20.connect(owner).approve(user1.address, transferAmount)

        // user1 transfers from owner to user2
        await erc20.connect(user1).transferFrom(owner.address, user2.address, transferAmount)

        // Check balances
        expect(await erc20.balanceOf(user2.address)).to.equal(transferAmount)

        // Check allowance is reduced
        expect(await erc20.allowance(owner.address, user1.address)).to.equal(0)
      })

      it('should revert when allowance is insufficient', async function () {
        const { erc20, owner, user1, user2 } = await loadFixture(deployMyErc20TokenFixture)

        // No allowance set
        await expect(
          erc20.connect(user1).transferFrom(owner.address, user2.address, 100)
        ).to.be.revertedWithCustomError(erc20, 'InsufficientAllowance')
      })

      it('should revert when transferring from zero address', async function () {
        const { erc20, user1, user2 } = await loadFixture(deployMyErc20TokenFixture)

        await expect(
          erc20
            .connect(user1)
            .transferFrom('0x0000000000000000000000000000000000000000', user2.address, 100)
        ).to.be.revertedWithCustomError(erc20, 'ZeroAddress')
      })

      it('should revert when transferring to zero address', async function () {
        const { erc20, owner, user1 } = await loadFixture(deployMyErc20TokenFixture)

        await expect(
          erc20
            .connect(user1)
            .transferFrom(owner.address, '0x0000000000000000000000000000000000000000', 100)
        ).to.be.revertedWithCustomError(erc20, 'ZeroAddress')
      })
    })
  })

  describe('Allowances', function () {
    describe('approve', function () {
      it('should set allowance correctly', async function () {
        const { erc20, owner, user1 } = await loadFixture(deployMyErc20TokenFixture)
        const approveAmount = 500n * 10n ** 18n // 500 tokens with 18 decimals

        await erc20.connect(owner).approve(user1.address, approveAmount)

        expect(await erc20.allowance(owner.address, user1.address)).to.equal(approveAmount)
      })

      it('should update allowance when called multiple times', async function () {
        const { erc20, owner, user1 } = await loadFixture(deployMyErc20TokenFixture)

        // First approval
        await erc20.connect(owner).approve(user1.address, 100)
        expect(await erc20.allowance(owner.address, user1.address)).to.equal(100)

        // Second approval (overwrites first)
        await erc20.connect(owner).approve(user1.address, 200)
        expect(await erc20.allowance(owner.address, user1.address)).to.equal(200)
      })

      it('should revert when approving zero address', async function () {
        const { erc20, owner } = await loadFixture(deployMyErc20TokenFixture)

        await expect(
          erc20.connect(owner).approve('0x0000000000000000000000000000000000000000', 100)
        ).to.be.revertedWithCustomError(erc20, 'ZeroAddress')
      })
    })

    describe('allowance', function () {
      it('should return zero for accounts with no allowance', async function () {
        const { erc20, owner, user1 } = await loadFixture(deployMyErc20TokenFixture)

        expect(await erc20.allowance(owner.address, user1.address)).to.equal(0)
      })
    })
  })

  describe('Minting', function () {
    it('should allow owner to mint tokens', async function () {
      const { erc20, owner, user1 } = await loadFixture(deployMyErc20TokenFixture)
      const mintAmount = 1000n * 10n ** 18n // 1000 tokens with 18 decimals

      const totalSupplyBefore = await erc20.totalSupply()
      const balanceBefore = await erc20.balanceOf(user1.address)

      await erc20.connect(owner).mint(user1.address, mintAmount)

      // Check total supply increased
      expect(await erc20.totalSupply()).to.equal(totalSupplyBefore + mintAmount)

      // Check user balance increased
      expect(await erc20.balanceOf(user1.address)).to.equal(balanceBefore + mintAmount)
    })

    it('should revert when non-owner tries to mint', async function () {
      const { erc20, user1, user2 } = await loadFixture(deployMyErc20TokenFixture)

      await expect(erc20.connect(user1).mint(user2.address, 100)).to.be.revertedWithCustomError(
        erc20,
        'NotOwner'
      )
    })

    it('should revert when minting to zero address', async function () {
      const { erc20, owner } = await loadFixture(deployMyErc20TokenFixture)

      await expect(
        erc20.connect(owner).mint('0x0000000000000000000000000000000000000000', 100)
      ).to.be.revertedWithCustomError(erc20, 'ZeroAddress')
    })
  })

  describe('Burning', function () {
    it('should allow users to burn their tokens', async function () {
      const { erc20, owner } = await loadFixture(deployMyErc20TokenFixture)
      const burnAmount = 100n * 10n ** 18n // 100 tokens with 18 decimals

      const totalSupplyBefore = await erc20.totalSupply()
      const balanceBefore = await erc20.balanceOf(owner.address)

      await erc20.connect(owner).burn(burnAmount)

      // Check total supply decreased
      expect(await erc20.totalSupply()).to.equal(totalSupplyBefore - burnAmount)

      // Check user balance decreased
      expect(await erc20.balanceOf(owner.address)).to.equal(balanceBefore - burnAmount)
    })

    it('should revert when burning more than balance', async function () {
      const { erc20, user1 } = await loadFixture(deployMyErc20TokenFixture)

      await expect(erc20.connect(user1).burn(100)).to.be.revertedWithCustomError(
        erc20,
        'InsufficientBalance'
      )
    })
  })
})

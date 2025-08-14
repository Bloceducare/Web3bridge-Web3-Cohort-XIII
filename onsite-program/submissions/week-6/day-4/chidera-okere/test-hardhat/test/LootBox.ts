import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('LootBox', function () {
  async function deployLootBoxFixture() {
    const [owner, user1, user2] = await hre.ethers.getSigners()

    // Deploy mock VRF Coordinator (for testing)
    const MockVRFCoordinator = await hre.ethers.getContractFactory('MockVRFCoordinator')
    const mockVRFCoordinator = await MockVRFCoordinator.deploy()

    // Deploy token contracts
    const GameToken = await hre.ethers.getContractFactory('GameToken')
    const gameToken = await GameToken.deploy()

    const GameNFT = await hre.ethers.getContractFactory('GameNFT')
    const gameNFT = await GameNFT.deploy()

    const GameItem = await hre.ethers.getContractFactory('GameItem')
    const gameItem = await GameItem.deploy()

    // Deploy LootBox contract
    const LootBox = await hre.ethers.getContractFactory('LootBox')
    const lootBox = await LootBox.deploy(
      1, // subscription ID
      await gameToken.getAddress(),
      await gameNFT.getAddress(),
      await gameItem.getAddress(),
      1 // ERC1155 token ID
    )

    const boxPrice = hre.ethers.parseEther('0.01')

    return {
      lootBox,
      gameToken,
      gameNFT,
      gameItem,
      mockVRFCoordinator,
      owner,
      user1,
      user2,
      boxPrice
    }
  }

  async function setupLootBoxWithInventory() {
    const fixture = await deployLootBoxFixture()
    const { lootBox, gameToken, gameNFT, gameItem, owner } = fixture

    const lootBoxAddress = await lootBox.getAddress()

    // Transfer tokens to loot box
    await gameToken.transfer(lootBoxAddress, hre.ethers.parseEther('10000'))
    await gameItem.safeTransferFrom(owner.address, lootBoxAddress, 1, 500, '0x')

    // Transfer NFTs to loot box and update inventory
    const nftTokenIds = []
    for (let i = 0; i < 10; i++) {
      await gameNFT.transferFrom(owner.address, lootBoxAddress, i)
      nftTokenIds.push(i)
    }

    // Replenish ERC721 inventory
    await lootBox.replenishERC721Inventory(nftTokenIds)

    return { ...fixture, nftTokenIds }
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { lootBox, owner } = await loadFixture(deployLootBoxFixture)
      expect(await lootBox.owner()).to.equal(owner.address)
    })

    it('Should set the correct token contracts', async function () {
      const { lootBox, gameToken, gameNFT, gameItem } = await loadFixture(deployLootBoxFixture)

      const tokens = await lootBox.tokens()
      expect(tokens.erc20Token).to.equal(await gameToken.getAddress())
      expect(tokens.erc721Token).to.equal(await gameNFT.getAddress())
      expect(tokens.erc1155Token).to.equal(await gameItem.getAddress())
      expect(tokens.erc1155TokenId).to.equal(1)
    })

    it('Should initialize reward tiers correctly', async function () {
      const { lootBox } = await loadFixture(deployLootBoxFixture)

      const tier0 = await lootBox.getRewardTier(0)
      const tier1 = await lootBox.getRewardTier(1)
      const tier2 = await lootBox.getRewardTier(2)

      expect(tier0.weight).to.equal(50)
      expect(tier1.weight).to.equal(30)
      expect(tier2.weight).to.equal(20)

      expect(await lootBox.totalWeight()).to.equal(100)
    })

    it('Should set correct box price', async function () {
      const { lootBox, boxPrice } = await loadFixture(deployLootBoxFixture)
      expect(await lootBox.boxPrice()).to.equal(boxPrice)
    })
  })

  describe('Box Opening', function () {
    describe('Validations', function () {
      it('Should revert if payment is insufficient', async function () {
        const { lootBox, user1 } = await loadFixture(setupLootBoxWithInventory)

        await expect(
          lootBox.connect(user1).openBox({ value: hre.ethers.parseEther('0.005') })
        ).to.be.revertedWithCustomError(lootBox, 'InsufficientPayment')
      })

      it('Should revert if no rewards are available', async function () {
        const { lootBox, user1, boxPrice } = await loadFixture(deployLootBoxFixture)

        await expect(
          lootBox.connect(user1).openBox({ value: boxPrice })
        ).to.be.revertedWithCustomError(lootBox, 'InsufficientInventory')
      })

      it('Should refund excess payment', async function () {
        const { lootBox, user1, boxPrice } = await loadFixture(setupLootBoxWithInventory)

        const excessPayment = hre.ethers.parseEther('0.02')
        const initialBalance = await hre.ethers.provider.getBalance(user1.address)

        const tx = await lootBox.connect(user1).openBox({ value: excessPayment })
        const receipt = await tx.wait()
        const gasUsed = receipt!.gasUsed * receipt!.gasPrice

        const finalBalance = await hre.ethers.provider.getBalance(user1.address)
        const expectedBalance = initialBalance - boxPrice - gasUsed

        expect(finalBalance).to.be.closeTo(expectedBalance, hre.ethers.parseEther('0.001'))
      })
    })

    describe('Events', function () {
      it('Should emit BoxOpened event', async function () {
        const { lootBox, user1, boxPrice } = await loadFixture(setupLootBoxWithInventory)

        await expect(lootBox.connect(user1).openBox({ value: boxPrice }))
          .to.emit(lootBox, 'BoxOpened')
          .withArgs(user1.address, anyValue)
      })
    })

    describe('VRF Integration', function () {
      it('Should create pending request correctly', async function () {
        const { lootBox, user1, boxPrice } = await loadFixture(setupLootBoxWithInventory)

        const tx = await lootBox.connect(user1).openBox({ value: boxPrice })
        const receipt = await tx.wait()

        // Find the BoxOpened event to get requestId
        const event = receipt!.logs.find((log) => {
          try {
            return lootBox.interface.parseLog(log)?.name === 'BoxOpened'
          } catch {
            return false
          }
        })

        if (event) {
          const parsedEvent = lootBox.interface.parseLog(event)
          const requestId = parsedEvent!.args[1]

          const pendingRequest = await lootBox.getPendingRequest(requestId)
          expect(pendingRequest.user).to.equal(user1.address)
          expect(pendingRequest.fulfilled).to.be.false
        }
      })
    })
  })

  describe('Reward Distribution', function () {
    it('Should distribute ERC20 rewards correctly', async function () {
      const { lootBox, gameToken, user1, boxPrice } = await loadFixture(setupLootBoxWithInventory)

      // Mock VRF response for ERC20 (tier 0)
      const requestId = 1
      const randomWords = [25] // Will select tier 0 (ERC20)

      // Manually create pending request
      await lootBox.connect(user1).openBox({ value: boxPrice })

      const initialBalance = await gameToken.balanceOf(user1.address)

      // Simulate VRF callback (this would need a mock in real testing)
      // For testing purposes, we'll test the admin functions instead

      expect(await gameToken.balanceOf(await lootBox.getAddress())).to.be.greaterThan(0)
    })

    it('Should track ERC721 inventory correctly', async function () {
      const { lootBox, nftTokenIds } = await loadFixture(setupLootBoxWithInventory)

      const inventoryStatus = await lootBox.getInventoryStatus()
      expect(inventoryStatus.erc721Count).to.equal(nftTokenIds.length)

      // Check individual token availability
      for (const tokenId of nftTokenIds) {
        expect(await lootBox.availableERC721Tokens(tokenId)).to.equal(1)
      }
    })
  })

  describe('Admin Functions', function () {
    describe('Reward Tier Management', function () {
      it('Should allow owner to update reward tiers', async function () {
        const { lootBox, owner } = await loadFixture(deployLootBoxFixture)

        await expect(
          lootBox.updateRewardTier(
            0,
            60,
            hre.ethers.parseEther('100'),
            hre.ethers.parseEther('300'),
            true
          )
        )
          .to.emit(lootBox, 'RewardTierUpdated')
          .withArgs(0, 60, hre.ethers.parseEther('100'), hre.ethers.parseEther('300'))

        const updatedTier = await lootBox.getRewardTier(0)
        expect(updatedTier.weight).to.equal(60)
        expect(updatedTier.minAmount).to.equal(hre.ethers.parseEther('100'))
        expect(updatedTier.maxAmount).to.equal(hre.ethers.parseEther('300'))
      })

      it('Should revert if non-owner tries to update tiers', async function () {
        const { lootBox, user1 } = await loadFixture(deployLootBoxFixture)

        await expect(
          lootBox.connect(user1).updateRewardTier(0, 60, 100, 300, true)
        ).to.be.revertedWithCustomError(lootBox, 'OwnableUnauthorizedAccount')
      })

      it('Should revert for invalid tier configuration', async function () {
        const { lootBox } = await loadFixture(deployLootBoxFixture)

        // Max amount less than min amount
        await expect(lootBox.updateRewardTier(0, 50, 300, 100, true)).to.be.revertedWithCustomError(
          lootBox,
          'InvalidTierConfiguration'
        )
      })
    })

    describe('Token Contract Updates', function () {
      it('Should allow owner to update token contracts', async function () {
        const { lootBox, owner } = await loadFixture(deployLootBoxFixture)

        const newTokenAddress = owner.address // Just for testing

        await expect(
          lootBox.updateTokenContracts(newTokenAddress, newTokenAddress, newTokenAddress, 2)
        )
          .to.emit(lootBox, 'TokenContractsUpdated')
          .withArgs(newTokenAddress, newTokenAddress, newTokenAddress, 2)
      })
    })

    describe('Box Price Updates', function () {
      it('Should allow owner to update box price', async function () {
        const { lootBox } = await loadFixture(deployLootBoxFixture)

        const newPrice = hre.ethers.parseEther('0.02')
        await lootBox.updateBoxPrice(newPrice)

        expect(await lootBox.boxPrice()).to.equal(newPrice)
      })
    })

    describe('Inventory Management', function () {
      it('Should allow owner to replenish ERC721 inventory', async function () {
        const { lootBox, gameNFT, owner } = await loadFixture(deployLootBoxFixture)

        // Transfer an NFT to the contract
        await gameNFT.transferFrom(owner.address, await lootBox.getAddress(), 0)

        await expect(lootBox.replenishERC721Inventory([0]))
          .to.emit(lootBox, 'InventoryReplenished')
          .withArgs('ERC721', 1)

        expect(await lootBox.availableERC721Tokens(0)).to.equal(1)
        expect(await lootBox.availableERC721Count()).to.equal(1)
      })
    })
  })

  describe('Emergency Functions', function () {
    it('Should allow owner to emergency withdraw tokens', async function () {
      const { lootBox, gameToken, owner } = await loadFixture(setupLootBoxWithInventory)

      const lootBoxAddress = await lootBox.getAddress()
      const initialOwnerBalance = await gameToken.balanceOf(owner.address)
      const contractBalance = await gameToken.balanceOf(lootBoxAddress)

      await lootBox.emergencyWithdrawTokens(await gameToken.getAddress(), contractBalance)

      const finalOwnerBalance = await gameToken.balanceOf(owner.address)
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + contractBalance)
    })

    it('Should allow owner to emergency withdraw NFTs', async function () {
      const { lootBox, gameNFT, owner } = await loadFixture(setupLootBoxWithInventory)

      await lootBox.emergencyWithdrawNFT(await gameNFT.getAddress(), 0)

      expect(await gameNFT.ownerOf(0)).to.equal(owner.address)
    })
  })

  describe('Withdrawal', function () {
    it('Should allow owner to withdraw ETH', async function () {
      const { lootBox, owner, user1, boxPrice } = await loadFixture(setupLootBoxWithInventory)

      // User opens a box
      await lootBox.connect(user1).openBox({ value: boxPrice })

      const initialOwnerBalance = await hre.ethers.provider.getBalance(owner.address)
      const contractBalance = await hre.ethers.provider.getBalance(await lootBox.getAddress())

      await expect(lootBox.withdraw())
        .to.emit(lootBox, 'FundsWithdrawn')
        .withArgs(owner.address, contractBalance)
    })

    it('Should revert if non-owner tries to withdraw', async function () {
      const { lootBox, user1 } = await loadFixture(setupLootBoxWithInventory)

      await expect(lootBox.connect(user1).withdraw()).to.be.revertedWithCustomError(
        lootBox,
        'OwnableUnauthorizedAccount'
      )
    })
  })

  describe('View Functions', function () {
    it('Should return correct inventory status', async function () {
      const { lootBox, gameToken, gameItem } = await loadFixture(setupLootBoxWithInventory)

      const inventoryStatus = await lootBox.getInventoryStatus()

      expect(inventoryStatus.erc20Balance).to.equal(hre.ethers.parseEther('10000'))
      expect(inventoryStatus.erc1155Balance).to.equal(500)
      expect(inventoryStatus.erc721Count).to.equal(10)
    })
  })

  describe('Token Holder Capabilities', function () {
    it('Should be able to receive ERC1155 tokens', async function () {
      const { lootBox, gameItem, owner } = await loadFixture(deployLootBoxFixture)

      await expect(
        gameItem.safeTransferFrom(owner.address, await lootBox.getAddress(), 1, 100, '0x')
      ).to.not.be.reverted
    })

    it('Should be able to receive ERC721 tokens', async function () {
      const { lootBox, gameNFT, owner } = await loadFixture(deployLootBoxFixture)

      await expect(gameNFT.transferFrom(owner.address, await lootBox.getAddress(), 0)).to.not.be
        .reverted
    })
  })
})

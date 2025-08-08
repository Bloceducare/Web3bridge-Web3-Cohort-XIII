import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('MultiSig deployment', function () {
  async function deployMultiSig() {
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners()

    const MultiSig = await hre.ethers.getContractFactory('MultiSig')
    const multiSig = await MultiSig.deploy([owner.address, addr1.address, addr2.address], 2)

    return { multiSig, owner, addr1, addr2, addr3 }
  }

  it('Should create a MultiSig wallet', async function () {
    const { multiSig, owner, addr1, addr2 } = await loadFixture(deployMultiSig)

    const owners = await multiSig.getOwners()

    expect(owners).to.deep.equal([owner.address, addr1.address, addr2.address])
    expect(await multiSig.required()).to.equal(2)
  })

  it('Should submit and execute a transaction', async function () {
    const { multiSig, owner, addr1, addr2, addr3 } = await loadFixture(deployMultiSig)

    // Fund the MultiSig
    await owner.sendTransaction({
      to: await multiSig.getAddress(),
      value: hre.ethers.parseEther('1.0')
    })

    // Submit transaction
    await multiSig
      .connect(owner)
      .send_transaction(addr3.address, hre.ethers.parseEther('0.5'), '0x')

    // Approve transaction
    await multiSig.connect(owner).approve(0)
    await multiSig.connect(addr1).approve(0)

    // Execute transaction
    await multiSig.connect(owner).execute(0)

    // Check transaction was executed
    const transaction = await multiSig.getTransaction(0)
    expect(transaction.executed).to.be.true
  })
})

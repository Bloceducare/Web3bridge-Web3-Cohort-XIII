import { expect } from 'chai'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import hre from 'hardhat'
// The fix: Import ethers directly from the 'hardhat' module.
import { ethers } from 'hardhat'

describe('InstitutionStaffNFT and TokenGatedDAO', function () {
  let owner: any, voter1: any, voter2: any
  let institutionStaffNFT: any, tokenGatedDAO: any

  beforeEach(async function () {
    ;[owner, voter1, voter2] = await ethers.getSigners()
    const InstitutionStaffNFT = await ethers.getContractFactory('InstitutionStaffNFT')
    institutionStaffNFT = await InstitutionStaffNFT.deploy()
    await institutionStaffNFT.waitForDeployment()
    const TokenGatedDAO = await ethers.getContractFactory('TokenGatedDAO')
    tokenGatedDAO = await TokenGatedDAO.deploy(await institutionStaffNFT.getAddress())
    await tokenGatedDAO.waitForDeployment()
  })

  it('should deploy contracts with correct initial state', async function () {
    expect(await institutionStaffNFT.name()).to.equal('Institution Staff NFT')
    expect(await institutionStaffNFT.symbol()).to.equal('STAFF')
    expect(await institutionStaffNFT.owner()).to.equal(owner.address)
    expect(await tokenGatedDAO.nftContract()).to.equal(await institutionStaffNFT.getAddress())
    expect(await tokenGatedDAO.getProposalCount()).to.equal(0n)
  })

  it('should mint an NFT and grant admin role', async function () {
    const tx = await institutionStaffNFT.mintStaff(voter1.address, 'Admin')
    const receipt = await tx.wait()
    const tokenId = receipt.logs[0].args.tokenId
    const adminRole = ethers.id('ADMIN_ROLE')
    const expirationDate = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60)
    await institutionStaffNFT.grantRole(
      adminRole,
      tokenId,
      voter1.address,
      expirationDate,
      true,
      '0x'
    )
    expect(await institutionStaffNFT.isAdmin(voter1.address)).to.be.true
    expect(await institutionStaffNFT.canVote(voter1.address)).to.be.true
  })

  it('should allow an eligible voter to create a proposal', async function () {
    const txMint = await institutionStaffNFT.mintStaff(voter1.address, 'Admin')
    const receiptMint = await txMint.wait()
    const tokenId = receiptMint.logs[0].args.tokenId
    const adminRole = ethers.id('ADMIN_ROLE')
    const expirationDate = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60)
    await institutionStaffNFT.grantRole(
      adminRole,
      tokenId,
      voter1.address,
      expirationDate,
      true,
      '0x'
    )
    const title = 'Test Proposal'
    const description = 'This is a test proposal'
    const target = ethers.ZeroAddress
    const callData = '0x'
    const value = 0n
    const tx = await tokenGatedDAO
      .connect(voter1)
      .createProposal(title, description, target, callData, value)
    const receipt = await tx.wait()
    const proposalId = receipt.logs[0].args.proposalId
    const proposal = await tokenGatedDAO.getProposal(proposalId)
    expect(proposal.title).to.equal(title)
    expect(proposal.description).to.equal(description)
    expect(proposal.proposer).to.equal(voter1.address)
    expect(proposal.state).to.equal(1n) // ProposalState.Active
  })

  it('should allow eligible voters to vote and update proposal state', async function () {
    const mentorRole = ethers.id('MENTOR_ROLE')
    const expirationDate = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60)
    const txMint1 = await institutionStaffNFT.mintStaff(voter1.address, 'Mentor')
    const receiptMint1 = await txMint1.wait()
    const tokenId1 = receiptMint1.logs[0].args.tokenId
    await institutionStaffNFT.grantRole(
      mentorRole,
      tokenId1,
      voter1.address,
      expirationDate,
      true,
      '0x'
    )
    const txMint2 = await institutionStaffNFT.mintStaff(voter2.address, 'Mentor')
    const receiptMint2 = await txMint2.wait()
    const tokenId2 = receiptMint2.logs[0].args.tokenId
    await institutionStaffNFT.grantRole(
      mentorRole,
      tokenId2,
      voter2.address,
      expirationDate,
      true,
      '0x'
    )
    const title = 'Test Proposal'
    const description = 'This is a test proposal'
    const target = ethers.ZeroAddress
    const callData = '0x'
    const value = 0n
    const tx = await tokenGatedDAO
      .connect(voter1)
      .createProposal(title, description, target, callData, value)
    const receipt = await tx.wait()
    const proposalId = receipt.logs[0].args.proposalId
    await tokenGatedDAO.connect(voter1).castVote(proposalId, 1n) // VoteType.For
    await tokenGatedDAO.connect(voter2).castVote(proposalId, 1n) // VoteType.For
    const proposal = await tokenGatedDAO.getProposal(proposalId)
    expect(proposal.forVotes).to.equal(2n)
    expect(proposal.againstVotes).to.equal(0n)
    expect(proposal.abstainVotes).to.equal(0n)
    // Fast-forward time to end voting period (7 days)
    await ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60])
    await ethers.provider.send('evm_mine', [])
    await tokenGatedDAO.updateProposalState(proposalId)
    const updatedProposal = await tokenGatedDAO.getProposal(proposalId)
    expect(updatedProposal.state).to.equal(3n) // ProposalState.Succeeded
  })

  it('should allow admin to execute a succeeded proposal', async function () {
    const txMintOwner = await institutionStaffNFT.mintStaff(owner.address, 'Admin')
    const receiptMintOwner = await txMintOwner.wait()
    const tokenIdOwner = receiptMintOwner.logs[0].args.tokenId
    const adminRole = ethers.id('ADMIN_ROLE')
    const expirationDate = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60)
    await institutionStaffNFT.grantRole(
      adminRole,
      tokenIdOwner,
      owner.address,
      expirationDate,
      true,
      '0x'
    )
    const mentorRole = ethers.id('MENTOR_ROLE')
    const txMint1 = await institutionStaffNFT.mintStaff(voter1.address, 'Mentor')
    const receiptMint1 = await txMint1.wait()
    const tokenId1 = receiptMint1.logs[0].args.tokenId
    await institutionStaffNFT.grantRole(
      mentorRole,
      tokenId1,
      voter1.address,
      expirationDate,
      true,
      '0x'
    )
    const txMint2 = await institutionStaffNFT.mintStaff(voter2.address, 'Mentor')
    const receiptMint2 = await txMint2.wait()
    const tokenId2 = receiptMint2.logs[0].args.tokenId
    await institutionStaffNFT.grantRole(
      mentorRole,
      tokenId2,
      voter2.address,
      expirationDate,
      true,
      '0x'
    )
    const title = 'Test Proposal'
    const description = 'This is a test proposal'
    const target = ethers.ZeroAddress
    const callData = '0x'
    const value = 0n
    const tx = await tokenGatedDAO
      .connect(voter1)
      .createProposal(title, description, target, callData, value)
    const receipt = await tx.wait()
    const proposalId = receipt.logs[0].args.proposalId
    await tokenGatedDAO.connect(voter1).castVote(proposalId, 1n)
    await tokenGatedDAO.connect(voter2).castVote(proposalId, 1n)
    await ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60])
    await ethers.provider.send('evm_mine', [])
    await tokenGatedDAO.updateProposalState(proposalId)
    await tokenGatedDAO.connect(owner).executeProposal(proposalId)
    const proposal = await tokenGatedDAO.getProposal(proposalId)
    expect(proposal.executed).to.be.true
    expect(proposal.state).to.equal(4n) // ProposalState.Executed
  })

  it('should prevent non-eligible voters from creating proposals', async function () {
    const title = 'Invalid Proposal'
    const description = 'This should fail'
    const target = ethers.ZeroAddress
    const callData = '0x'
    const value = 0n
    await expect(
      tokenGatedDAO.connect(voter1).createProposal(title, description, target, callData, value)
    ).to.be.rejectedWith('Not eligible to vote')
  })
})

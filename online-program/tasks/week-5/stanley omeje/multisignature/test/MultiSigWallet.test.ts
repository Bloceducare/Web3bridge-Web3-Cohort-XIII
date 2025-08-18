import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MultiSigWallet } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('MultiSigWallet', function () {
  let multiSigWallet: MultiSigWallet;
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let owner3: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let recipient: SignerWithAddress;

  const requiredConfirmations = 2;

  beforeEach(async function () {
    [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();

    const MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
    multiSigWallet = await MultiSigWallet.deploy(
      [owner1.address, owner2.address, owner3.address],
      requiredConfirmations
    );
    await multiSigWallet.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right owners', async function () {
      expect(await multiSigWallet.getOwners()).to.deep.equal([
        owner1.address,
        owner2.address,
        owner3.address,
      ]);
    });

    it('Should set the right required confirmations', async function () {
      expect(await multiSigWallet.requiredConfirmations()).to.equal(
        requiredConfirmations
      );
    });

    it('Should revert if owners array is empty', async function () {
      const MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
      await expect(MultiSigWallet.deploy([], 1)).to.be.revertedWith(
        'Owners required'
      );
    });

    it('Should revert if required confirmations is invalid', async function () {
      const MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
      await expect(
        MultiSigWallet.deploy([owner1.address, owner2.address], 3)
      ).to.be.revertedWith('Invalid number of required confirmations');
    });
  });

  describe('Deposits', function () {
    it('Should accept ETH deposits', async function () {
      const depositAmount = ethers.parseEther('1.0');

      await expect(
        owner1.sendTransaction({
          to: await multiSigWallet.getAddress(),
          value: depositAmount,
        })
      )
        .to.emit(multiSigWallet, 'Deposit')
        .withArgs(owner1.address, depositAmount, depositAmount);

      expect(
        await ethers.provider.getBalance(multiSigWallet.getAddress())
      ).to.equal(depositAmount);
    });
  });

  describe('Transaction Submission', function () {
    it('Should allow owners to submit transactions', async function () {
      const to = recipient.address;
      const value = ethers.parseEther('0.5');
      const data = '0x';

      await expect(
        multiSigWallet.connect(owner1).submitTransaction(to, value, data)
      )
        .to.emit(multiSigWallet, 'TransactionSubmitted')
        .withArgs(0, to, value);

      const tx = await multiSigWallet.getTransaction(0);
      expect(tx.to).to.equal(to);
      expect(tx.value).to.equal(value);
      expect(tx.data).to.equal(data);
      expect(tx.executed).to.be.false;
      expect(tx.confirmationCount).to.equal(0);
    });

    it('Should revert if non-owner tries to submit transaction', async function () {
      await expect(
        multiSigWallet
          .connect(nonOwner)
          .submitTransaction(recipient.address, 100, '0x')
      ).to.be.revertedWith('Not an owner');
    });
  });

  describe('Transaction Confirmation', function () {
    beforeEach(async function () {
      // Add some ETH to the wallet
      await owner1.sendTransaction({
        to: await multiSigWallet.getAddress(),
        value: ethers.parseEther('2.0'),
      });

      // Submit a transaction
      await multiSigWallet
        .connect(owner1)
        .submitTransaction(recipient.address, ethers.parseEther('1.0'), '0x');
    });

    it('Should allow owners to confirm transactions', async function () {
      await expect(multiSigWallet.connect(owner1).confirmTransaction(0))
        .to.emit(multiSigWallet, 'TransactionConfirmed')
        .withArgs(0, owner1.address);

      const tx = await multiSigWallet.getTransaction(0);
      expect(tx.confirmationCount).to.equal(1);
      expect(await multiSigWallet.isConfirmed(0, owner1.address)).to.be.true;
    });

    it('Should revert if non-owner tries to confirm', async function () {
      await expect(
        multiSigWallet.connect(nonOwner).confirmTransaction(0)
      ).to.be.revertedWith('Not an owner');
    });

    it('Should revert if owner tries to confirm twice', async function () {
      await multiSigWallet.connect(owner1).confirmTransaction(0);
      await expect(
        multiSigWallet.connect(owner1).confirmTransaction(0)
      ).to.be.revertedWith('Transaction already confirmed');
    });

    it('Should revert if transaction does not exist', async function () {
      await expect(
        multiSigWallet.connect(owner1).confirmTransaction(999)
      ).to.be.revertedWith('Transaction does not exist');
    });
  });

  describe('Transaction Revocation', function () {
    beforeEach(async function () {
      await owner1.sendTransaction({
        to: await multiSigWallet.getAddress(),
        value: ethers.parseEther('2.0'),
      });

      await multiSigWallet
        .connect(owner1)
        .submitTransaction(recipient.address, ethers.parseEther('1.0'), '0x');

      await multiSigWallet.connect(owner1).confirmTransaction(0);
    });

    it('Should allow owners to revoke confirmations', async function () {
      await expect(multiSigWallet.connect(owner1).revokeConfirmation(0))
        .to.emit(multiSigWallet, 'TransactionRevoked')
        .withArgs(0, owner1.address);

      const tx = await multiSigWallet.getTransaction(0);
      expect(tx.confirmationCount).to.equal(0);
      expect(await multiSigWallet.isConfirmed(0, owner1.address)).to.be.false;
    });

    it('Should revert if trying to revoke non-confirmed transaction', async function () {
      await expect(
        multiSigWallet.connect(owner2).revokeConfirmation(0)
      ).to.be.revertedWith('Transaction not confirmed');
    });
  });

  describe('Transaction Execution', function () {
    beforeEach(async function () {
      await owner1.sendTransaction({
        to: await multiSigWallet.getAddress(),
        value: ethers.parseEther('2.0'),
      });

      await multiSigWallet
        .connect(owner1)
        .submitTransaction(recipient.address, ethers.parseEther('1.0'), '0x');
    });

    it('Should execute transaction when threshold is reached', async function () {
      await multiSigWallet.connect(owner1).confirmTransaction(0);
      await multiSigWallet.connect(owner2).confirmTransaction(0);

      const initialBalance = await ethers.provider.getBalance(
        recipient.address
      );

      await expect(multiSigWallet.connect(owner1).executeTransaction(0))
        .to.emit(multiSigWallet, 'TransactionExecuted')
        .withArgs(0);

      const tx = await multiSigWallet.getTransaction(0);
      expect(tx.executed).to.be.true;

      const finalBalance = await ethers.provider.getBalance(recipient.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther('1.0'));
    });

    it('Should revert if trying to execute without enough confirmations', async function () {
      await multiSigWallet.connect(owner1).confirmTransaction(0);

      await expect(
        multiSigWallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith('Cannot execute transaction');
    });

    it('Should revert if trying to execute already executed transaction', async function () {
      await multiSigWallet.connect(owner1).confirmTransaction(0);
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      await multiSigWallet.connect(owner1).executeTransaction(0);

      await expect(
        multiSigWallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith('Transaction already executed');
    });

    it('Should revert if transaction fails', async function () {
      // Submit transaction with more value than wallet balance
      await multiSigWallet
        .connect(owner1)
        .submitTransaction(recipient.address, ethers.parseEther('10.0'), '0x');

      await multiSigWallet.connect(owner1).confirmTransaction(1);
      await multiSigWallet.connect(owner2).confirmTransaction(1);

      await expect(
        multiSigWallet.connect(owner1).executeTransaction(1)
      ).to.be.revertedWith('Transaction failed');
    });
  });

  describe('View Functions', function () {
    it('Should return correct transaction count', async function () {
      expect(await multiSigWallet.getTransactionCount()).to.equal(0);

      await multiSigWallet
        .connect(owner1)
        .submitTransaction(recipient.address, 100, '0x');

      expect(await multiSigWallet.getTransactionCount()).to.equal(1);
    });

    it('Should return correct owners list', async function () {
      const owners = await multiSigWallet.getOwners();
      expect(owners).to.deep.equal([
        owner1.address,
        owner2.address,
        owner3.address,
      ]);
    });
  });
});

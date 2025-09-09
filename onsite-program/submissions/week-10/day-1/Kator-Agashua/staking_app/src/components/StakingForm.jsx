import { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnection from './WalletConnection';
import { CONTRACT_ADDRESS } from '../contracts/config';
import StakingABI from '../contracts/StakingABI.json';

const StakingForm = () => {
  const [amount, setAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signer, isConnected } = WalletConnection();

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleStake = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsStaking(true);
      setError('');
      setSuccess('');
      setTxHash('');

      // Convert amount to wei (assuming token has 18 decimals)
      const amountInWei = ethers.utils.parseEther(amount);
      
      // Create contract instance
      const stakingContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        StakingABI,
        signer
      );

      // Call stake function
      const tx = await stakingContract.stake(amountInWei);
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      await tx.wait();

      setSuccess(`Successfully staked ${amount} tokens!`);
      setAmount('');
    } catch (err) {
      console.error('Staking error:', err);
      setError(err.message || 'Error staking tokens');
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div className="staking-form-container">
      <h2>Stake Tokens</h2>
      
      <form onSubmit={handleStake}>
        <div className="form-group">
          <label htmlFor="amount">Amount to Stake:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            disabled={isStaking || !isConnected}
            min="0"
            step="0.000001"
            required
          />
        </div>

        <button 
          type="submit" 
          className="stake-button"
          disabled={isStaking || !isConnected}
        >
          {isStaking ? 'Staking...' : 'Stake'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {txHash && (
        <div className="tx-hash">
          Transaction: <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash.substring(0, 10)}...</a>
        </div>
      )}
    </div>
  );
};

export default StakingForm;
import { useState } from 'react';
import WalletConnection from './WalletConnection';
import { withdrawStake, claimRewards, formatEther } from '../utils/contractHelpers';

const WithdrawAndClaim = ({ stake, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [action, setAction] = useState('');

  const { signer, isConnected } = WalletConnection();

  const resetState = () => {
    setError('');
    setSuccess('');
    setTxHash('');
    setAction('');
  };

  const handleWithdraw = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsProcessing(true);
      resetState();
      setAction('withdraw');

      // In the updated contract, we need to pass the amount to withdraw
      const tx = await withdrawStake(signer, stake.amount);
      setTxHash(tx.hash);

      await tx.wait();

      setSuccess(`Successfully withdrawn ${formatEther(stake.amount)} tokens!`);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err.message || 'Error withdrawing tokens');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsProcessing(true);
      resetState();
      setAction('claim');

      // In this contract, rewards are claimed during withdrawal
      setError('This contract does not support separate reward claiming. Rewards are automatically claimed during withdrawal.');
    } catch (err) {
      console.error('Claim rewards error:', err);
      setError(err.message || 'Error claiming rewards');
    } finally {
      setIsProcessing(false);
    }
  };

  // Emergency withdraw is not supported in this contract version

  return (
    <div className="withdraw-claim-container">
      <div className="action-buttons">
        <button 
          onClick={handleWithdraw} 
          disabled={isProcessing || !isConnected || (stake.canWithdraw !== undefined && !stake.canWithdraw)}
          className={`action-button ${action === 'withdraw' ? 'active' : ''}`}
        >
          {isProcessing && action === 'withdraw' ? 'Processing...' : 'Withdraw'}
        </button>
      </div>
      
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

export default WithdrawAndClaim;
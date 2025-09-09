import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useStakingData, useStakingActions } from '../hooks/useContracts';
import { formatTokenAmount } from '../utils';

/**
 * RewardsSection component - Shows user's accumulated rewards and allows claiming
 * Rewards are earned continuously while tokens are staked
 */
const RewardsSection = () => {
  // Get wallet connection status
  const { isConnected, isCorrectChain } = useWeb3();
  
  // Get user's reward data and stakes
  const { pendingRewards, userStakes, refetch } = useStakingData();
  
  // Get function to claim rewards
  const { claimRewards, isLoading } = useStakingActions();

  /**
   * Handle claiming accumulated rewards
   * This gives the user their earned tokens without unstaking their principal
   */
  const handleClaimRewards = async () => {
    try {
      console.log('Claiming rewards...');
      await claimRewards();
      
      // Refresh data to show updated rewards balance
      await refetch();
      alert('Rewards claimed successfully! 🎉');
    } catch (error) {
      console.error('Claim rewards error:', error);
      alert('Failed to claim rewards: ' + error.message);
    }
  };

  /**
   * Calculate total amount user has staked across all active positions
   */
  const totalStaked = userStakes.reduce(
    (sum, stake) => stake.active ? sum + stake.amount : sum,
    0n // Start with 0, add each active stake's amount
  );

  // Show connection prompt if wallet not connected or wrong network
  if (!isConnected || !isCorrectChain) {
    return (
      <div className="card" id="rewards">
        <h2 className="text-xl font-bold mb-4"> Rewards</h2>
        <p className="text-gray-500 text-center py-8">
          {!isConnected ? 'Please connect your wallet' : 'Please switch to Sepolia network'}
        </p>
      </div>
    );
  }

  return (
    <div className="card" id="rewards">
      <h2 className="text-xl font-bold mb-6"> Rewards</h2>
      
      {/* Rewards Overview - Two stat cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Pending Rewards Card */}
        <div className="stat-card">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-700 mb-2">
              {formatTokenAmount(pendingRewards)}
            </div>
            <div className="text-sm text-primary-600 font-medium">Pending Rewards</div>
          </div>
        </div>
        
        {/* Total Staked Card */}
        <div className="stat-card">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-700 mb-2">
              {formatTokenAmount(totalStaked)}
            </div>
            <div className="text-sm text-primary-600 font-medium">Total Staked</div>
          </div>
        </div>
      </div>

      {/* Claim Rewards Button */}
      <div className="text-center">
        <button
          onClick={handleClaimRewards}
          disabled={pendingRewards === 0n || isLoading} // Disable if no rewards or transaction in progress
          className={`btn-primary px-8 py-3 text-lg ${
            pendingRewards === 0n ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading 
            ? 'Claiming...' 
            : `Claim ${formatTokenAmount(pendingRewards)} Tokens`}
        </button>
        
        {/* Show message when no rewards available */}
        {pendingRewards === 0n && (
          <p className="text-gray-500 text-sm mt-2">
            No rewards available to claim
          </p>
        )}
      </div>

      {/* Educational Information */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2"> How Rewards Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Rewards are calculated based on your staking amount and time</li>
          <li>• APR decreases as more tokens are staked in the protocol</li>
          <li>• Rewards accumulate continuously while your tokens are staked</li>
          <li>• You can claim rewards without unstaking your tokens</li>
        </ul>
      </div>
    </div>
  );
};

export default RewardsSection;
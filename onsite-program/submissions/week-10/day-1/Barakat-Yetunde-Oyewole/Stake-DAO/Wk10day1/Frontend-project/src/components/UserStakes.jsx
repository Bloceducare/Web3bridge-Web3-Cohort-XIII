import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useStakingData, useStakingActions } from '../hooks/useContracts';
import { formatTokenAmount, formatTimeRemaining, getUnlockTime, isStakeUnlocked, calculateAPR } from '../utils';

/**
 * UserStakes component - Displays all of the user's staking positions
 * Shows details for each stake and provides withdraw/emergency withdraw options
 */
const UserStakes = () => {
  // Get wallet connection status
  const { isConnected, isCorrectChain } = useWeb3();
  
  // Get user's stakes and refresh function
  const { userStakes, refetch } = useStakingData();
  
  // Get functions to interact with contracts
  const { withdraw, emergencyWithdraw, isLoading } = useStakingActions();

  /**
   * Handle normal withdrawal (only works for unlocked stakes)
   */
  const handleWithdraw = async (stakeIndex) => {
    try {
      console.log(`Withdrawing stake ${stakeIndex}...`);
      await withdraw(stakeIndex);
      
      // Refresh data to show updated stakes
      await refetch();
      alert('Withdrawal successful! ');
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Withdrawal failed: ' + error.message);
    }
  };

  /**
   * Handle emergency withdrawal (works anytime but has 50% penalty)
   */
  const handleEmergencyWithdraw = async (stakeIndex) => {
    // Double-check with user because this has a penalty
    if (!window.confirm('Emergency withdrawal will incur a 50% penalty. Are you sure?')) {
      return;
    }
    
    try {
      console.log(`Emergency withdrawing stake ${stakeIndex}...`);
      await emergencyWithdraw(stakeIndex);
      
      // Refresh data to show updated stakes
      await refetch();
      alert('Emergency withdrawal successful! (50% penalty applied)');
    } catch (error) {
      console.error('Emergency withdrawal error:', error);
      alert('Emergency withdrawal failed: ' + error.message);
    }
  };

  // Show connection prompt if wallet not connected or wrong network
  if (!isConnected || !isCorrectChain) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4"> Your Stakes</h2>
        <p className="text-gray-500 text-center py-8">
          {!isConnected ? 'Please connect your wallet' : 'Please switch to Sepolia network'}
        </p>
      </div>
    );
  }

  // Show empty state if user has no stakes
  if (userStakes.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4"> Your Stakes</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4"></div>
          <p className="text-gray-500">No stakes yet. Start staking to see your positions here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6"> Your Stakes</h2>
      
      <div className="space-y-4">
        {/* Loop through each stake and render a card */}
        {userStakes.map((stake, index) => {
          // Calculate timing information for this stake
          const unlockTime = getUnlockTime(stake); // When this stake unlocks
          const unlocked = isStakeUnlocked(stake); // Is it unlocked right now?
          const apr = calculateAPR(stake.rewardRate); // What APR does this stake earn?
          
          return (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                stake.active 
                  ? 'border-green-200 bg-green-50' // Green for active stakes
                  : 'border-gray-200 bg-gray-50'   // Gray for inactive stakes
              }`}
            >
              
              {/* Stake Header - Amount and Status */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    {/* Amount staked */}
                    <span className="font-semibold text-lg">
                      {formatTokenAmount(stake.amount)} Tokens
                    </span>
                    
                    {/* Active/Inactive badge */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stake.active
                          ? 'bg-green-100 text-green-800' // Green badge for active
                          : 'bg-gray-100 text-gray-800'   // Gray badge for inactive
                      }`}
                    >
                      {stake.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* APR earned by this stake */}
                  <p className="text-sm text-gray-600">APR: {apr}%</p>
                </div>
                
                {/* Lock Status and Stake Number */}
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {unlocked ? (
                      <span className="text-green-600 font-medium"> Unlocked</span>
                    ) : (
                      <span className="text-orange-600">
                         {formatTimeRemaining(unlockTime)}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stake #{index + 1}
                  </p>
                </div>
              </div>

              {/* Stake Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-600">Staked:</span>
                  <span className="ml-2 font-medium">
                    {/* Convert timestamp to readable date */}
                    {new Date(Number(stake.timestamp) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Lock Duration:</span>
                  <span className="ml-2 font-medium">
                    {/* Convert seconds to days */}
                    {Number(stake.lockDuration) / 86400} days
                  </span>
                </div>
              </div>

              {/* Action Buttons - Only show for active stakes */}
              {stake.active && (
                <div className="flex space-x-2">
                  
                  {/* Normal Withdraw Button */}
                  <button
                    onClick={() => handleWithdraw(stake.index)}
                    disabled={!unlocked || isLoading} // Only enabled if unlocked and not loading
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      unlocked
                        ? 'bg-green-600 hover:bg-green-700 text-white' // Green when available
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed' // Gray when locked
                    }`}
                  >
                    {isLoading ? 'Processing...' : unlocked ? 'Withdraw' : 'Locked'}
                  </button>
                  
                  {/* Emergency Withdraw Button */}
                  <button
                    onClick={() => handleEmergencyWithdraw(stake.index)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Emergency (50% penalty)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserStakes;
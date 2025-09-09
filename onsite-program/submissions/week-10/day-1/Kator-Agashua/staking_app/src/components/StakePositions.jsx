import { useState, useEffect } from 'react';
import WalletConnection from './WalletConnection';
import WithdrawAndClaim from './WithdrawAndClaim';
import { getUserStakes, getAllStakes, getStakePendingRewards, formatEther, calculateTimeUntilUnlock } from '../utils/contractHelpers';

const StakePositions = () => {
  const [userStakes, setUserStakes] = useState([]);
  const [allStakes, setAllStakes] = useState([]);
  const [pendingRewards, setPendingRewards] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('user'); // 'user' or 'all'

  const { account, provider, isConnected } = WalletConnection();

  // Load stake data
  const loadStakeData = async () => {
    
    if (!provider) return;

    setIsLoading(true);
    setError('');

    try {
      // Get all stakes
      const allStakesData = await getAllStakes(provider);
      console.log(allStakesData);
      
      setAllStakes(allStakesData);

      // Get user stakes if connected
      if (isConnected && account) {
        const userStakesData = await getUserStakes(provider, account);
        setUserStakes(userStakesData);

        // Get pending rewards
        const rewards = {};
        const reward = await getStakePendingRewards(provider, account);
        // Since we only have one stake per user in this contract, use stake.id as key
        if (userStakesData.length > 0) {
          rewards[userStakesData[0].id.toString()] = reward;
        }
        setPendingRewards(rewards);
      }
    } catch (err) {
      console.error('Error loading stake data:', err);
      setError('Failed to load stake data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when account changes
  useEffect(() => {
    loadStakeData();
  }, [provider, account, isConnected]);

  // Render user stakes
  const renderUserStakes = () => {
    if (!isConnected) {
      return <p className="connect-prompt">Please connect your wallet to view your stakes</p>;
    }

    if (userStakes.length === 0) {
      return <p className="no-stakes">You don't have any active stakes</p>;
    }

    return (
      <div className="stakes-list">
        {userStakes.map((stake) => (
          <div key={stake.id.toString()} className="stake-item">
            <div className="stake-details">
              <div className="stake-id">Stake #{stake.id.toString()}</div>
              <div className="stake-amount">{formatEther(stake.amount)} Tokens</div>
              <div className="stake-time">
                <div>Start: {new Date(stake.startTime.toNumber() * 1000).toLocaleString()}</div>
                {stake.unlockTime && (
                  <>
                    <div>Unlock: {new Date(stake.unlockTime.toNumber() * 1000).toLocaleString()}</div>
                    <div>Time Left: {calculateTimeUntilUnlock(stake.unlockTime.toNumber())}</div>
                  </>
                )}
                {stake.timeUntilUnlock && (
                  <div>Time Until Unlock: {calculateTimeUntilUnlock(Math.floor(Date.now() / 1000) + stake.timeUntilUnlock.toNumber())}</div>
                )}
              </div>
              <div className="stake-rewards">
                Pending Rewards: {pendingRewards[stake.id.toString()] ? formatEther(pendingRewards[stake.id.toString()]) : '0'} Tokens
              </div>
              {stake.canWithdraw !== undefined && (
                <div className="stake-status">
                  Status: {stake.canWithdraw ? 'Ready to withdraw' : 'Locked'}
                </div>
              )}
            </div>
            
            <WithdrawAndClaim 
              stake={stake} 
              onSuccess={loadStakeData} 
            />
          </div>
        ))}
      </div>
    );
  };

  // Render all stakes
  const renderAllStakes = () => {
    if (allStakes.length === 0) {
      return <p className="no-stakes">No stakes in the protocol</p>;
    }

    return (
      <div className="stakes-list">
        {allStakes.map((stake) => (
          <div key={stake.id.toString()} className="stake-item">
            <div className="stake-details">
              <div className="stake-id">Total Protocol Stakes</div>
              <div className="stake-amount">{formatEther(stake.amount)} Tokens</div>
              {stake.isGlobal && (
                <div className="stake-global-info">
                  This represents the total amount staked in the protocol.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="stake-positions-container">
      <div className="view-toggle">
        <button 
          className={`toggle-button ${viewMode === 'user' ? 'active' : ''}`}
          onClick={() => setViewMode('user')}
        >
          My Stakes
        </button>
        <button 
          className={`toggle-button ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All Stakes
        </button>
      </div>

      <div className="refresh-button-container">
        <button 
          className="refresh-button" 
          onClick={loadStakeData}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stakes-container">
        {viewMode === 'user' ? renderUserStakes() : renderAllStakes()}
      </div>
    </div>
  );
};

export default StakePositions;
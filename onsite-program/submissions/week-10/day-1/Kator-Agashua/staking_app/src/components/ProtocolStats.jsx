import { useState, useEffect } from 'react';
import WalletConnection from './WalletConnection';
import { getTotalStaked, getRewardRate, getAPR, formatEther } from '../utils/contractHelpers';

const ProtocolStats = () => {
  const [totalStaked, setTotalStaked] = useState('0');
  const [rewardRate, setRewardRate] = useState('0');
  const [apr, setAPR] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { provider } = WalletConnection();

  // Load protocol statistics
  const loadStats = async () => {
    if (!provider) return;

    setIsLoading(true);
    setError('');

    try {
      // Get total staked
      const totalStakedData = await getTotalStaked(provider);
      setTotalStaked(formatEther(totalStakedData));

      // Get reward rate
      const rewardRateData = await getRewardRate(provider);
      setRewardRate(formatEther(rewardRateData));

      // Get APR
      const aprData = await getAPR(provider);
      setAPR((aprData.toNumber() / 100).toFixed(2)); // Assuming APR is returned as basis points
    } catch (err) {
      console.error('Error loading protocol stats:', err);
      setError('Failed to load protocol statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when provider changes
  useEffect(() => {
    loadStats();
  }, [provider]);

  return (
    <div className="protocol-stats-container">
      <h2>Protocol Statistics</h2>
      
      {isLoading ? (
        <p className="loading">Loading statistics...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Total Staked</div>
            <div className="stat-value">{totalStaked} Tokens</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Reward Rate</div>
            <div className="stat-value">{rewardRate} Tokens/day</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Current APR</div>
            <div className="stat-value">{apr}%</div>
          </div>
        </div>
      )}
      
      <button 
        className="refresh-button" 
        onClick={loadStats}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  );
};

export default ProtocolStats;
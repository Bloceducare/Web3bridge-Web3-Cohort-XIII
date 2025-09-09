import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACTS, STAKING_CONTRACT_ABI, ERC20_ABI } from '../config/contracts';

/**
 * Custom hook to create contract instances using ethers
 * Returns contract objects that we can use to call functions
 */
export const useContracts = () => {
  const { provider, signer, isConnected } = useWeb3();
  const [stakingContract, setStakingContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  useEffect(() => {
    if (provider) {
      // Create staking contract instance
      // Use signer for write operations (when user is connected) or provider for read-only
      const staking = new ethers.Contract(
        CONTRACTS.STAKING_CONTRACT,
        STAKING_CONTRACT_ABI,
        signer || provider // Use signer if available (for transactions), otherwise provider (for reading)
      );
      
      // Create token contract instance  
      const token = new ethers.Contract(
        CONTRACTS.MOCK_ERC20,
        ERC20_ABI,
        signer || provider
      );
      
      setStakingContract(staking);
      setTokenContract(token);
      console.log('Contracts initialized successfully');
    } else {
      setStakingContract(null);
      setTokenContract(null);
    }
  }, [provider, signer, isConnected]);

  return { stakingContract, tokenContract };
};

/**
 * Custom hook to fetch and manage staking-related data
 * This handles all the read operations to get current state from the blockchain
 */
export const useStakingData = () => {
  const { account, isConnected } = useWeb3();
  const { stakingContract, tokenContract } = useContracts();
  
  // State to store all the data we fetch from the blockchain
  const [userStakes, setUserStakes] = useState([]); // User's individual stakes
  const [pendingRewards, setPendingRewards] = useState(0n); // Unclaimed rewards
  const [tokenBalance, setTokenBalance] = useState(0n); // User's token balance
  const [tokenAllowance, setTokenAllowance] = useState(0n); // How much staking contract can spend
  const [protocolStats, setProtocolStats] = useState({
    totalStaked: 0n, // Total tokens staked by all users
    currentRewardRate: 0n, // Current APR
  });
  const [loading, setLoading] = useState(false);
  
  // Add a refresh counter to force re-renders
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Fetch all user-specific data from the blockchain
   */
  const fetchUserData = useCallback(async () => {
    // Only fetch if we have contracts and a connected account
    if (!stakingContract || !tokenContract || !account) return;

    try {
      setLoading(true);
      console.log('🔄 Starting fetchUserData...');
      
      // Fetch token balance first (this should always work)
      console.log('🔄 Fetching balance for account:', account);
      console.log('🔄 Using token contract:', tokenContract?.target);
      
      const balance = await tokenContract.balanceOf(account);
      console.log('🔄 Raw balance from contract:', balance.toString());
      console.log('🔄 Formatted balance:', ethers.formatEther(balance));
      
      // FIXED: Simply set the balance without weird setTimeout hack
      setTokenBalance(balance);

      // Fetch how much the staking contract is allowed to spend
      const allowance = await tokenContract.allowance(account, CONTRACTS.STAKING_CONTRACT);
      setTokenAllowance(allowance);
      console.log('✅ Token balance and allowance fetched successfully');

      // Try to fetch staking-related data (this might fail if user has no stakes)
      try {
        // Fetch user's stakes from the staking contract
        const stakes = await stakingContract.getUserStakes(account);
        
        // Add index to each stake for easier tracking
        const stakesWithIndex = stakes.map((stake, index) => ({
          amount: stake.amount, // How much they staked
          timestamp: stake.timestamp, // When they staked
          lockDuration: stake.lockDuration, // How long it's locked
          rewardRate: stake.rewardRate, // APR when they staked
          active: stake.active, // Is this stake still active
          index, // Which stake number this is
        }));
        setUserStakes(stakesWithIndex);

        // Fetch user's pending rewards
        const rewards = await stakingContract.getPendingRewards(account);
        setPendingRewards(rewards);
        
        console.log('✅ Staking data fetched successfully');
      } catch (stakingError) {
        console.warn('⚠️ Could not fetch staking data (user might not have any stakes):', stakingError.message);
        // Set empty defaults for staking data
        setUserStakes([]);
        setPendingRewards(0n);
      }

      console.log('🔄 fetchUserData completed successfully');
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [stakingContract, tokenContract, account, refreshKey]); // Added refreshKey as dependency

  /**
   * Fetch protocol-wide statistics (doesn't require user account)
   */
  const fetchProtocolData = useCallback(async () => {
    if (!stakingContract) return;

    try {
      // Fetch total amount staked across all users
      const totalStaked = await stakingContract.totalStaked();
      
      // Fetch current reward rate (APR)
      const currentRewardRate = await stakingContract.currentRewardRate();

      setProtocolStats({
        totalStaked,
        currentRewardRate,
      });
    } catch (error) {
      console.error('Error fetching protocol data:', error);
    }
  }, [stakingContract]);

  // Auto-fetch data when component mounts or dependencies change
  useEffect(() => {
    if (isConnected) {
      fetchUserData(); // Only fetch user data if wallet is connected
    }
    fetchProtocolData(); // Always fetch protocol stats
  }, [isConnected, fetchUserData, fetchProtocolData]);

  /**
   * Manual refetch function that components can call after making changes
   * FIXED VERSION - Forces a complete refresh
   */
  const refetch = useCallback(async () => {
    console.log('🔄 Refetch called - starting data refresh...');
    
    // Force a re-render by updating refresh key
    setRefreshKey(prev => prev + 1);
    
    if (isConnected && stakingContract && tokenContract && account) {
      console.log('🔄 Conditions met, calling fetchUserData...');
      await fetchUserData();
    }
    await fetchProtocolData();
    console.log('✅ Refetch completed');
  }, [isConnected, fetchUserData, fetchProtocolData, stakingContract, tokenContract, account]);

  return {
    userStakes,
    pendingRewards,
    tokenBalance,
    tokenAllowance,
    protocolStats,
    loading,
    refetch, // Components can call this to refresh data
  };
};

/**
 * Custom hook to handle all write operations (transactions that cost gas)
 */
export const useStakingActions = () => {
  const { stakingContract, tokenContract } = useContracts();
  const { account } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Approve tokens for the staking contract to spend
   * This must be done before staking
   */
  const approveTokens = async (amount) => {
    if (!tokenContract) throw new Error('Token contract not available');
    
    setIsLoading(true);
    try {
      // Call the approve function on the token contract
      const tx = await tokenContract.approve(CONTRACTS.STAKING_CONTRACT, amount);
      
      // Wait for the transaction to be mined
      await tx.wait();
      return tx;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Stake tokens in the contract
   */
  const stake = async (amount) => {
    if (!stakingContract) throw new Error('Staking contract not available');
    
    setIsLoading(true);
    try {
      // Call the stake function
      const tx = await stakingContract.stake(amount);
      
      // Wait for confirmation
      await tx.wait();
      return tx;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Withdraw a specific stake (only works if unlocked)
   */
  const withdraw = async (stakeIndex) => {
    if (!stakingContract) throw new Error('Staking contract not available');
    
    setIsLoading(true);
    try {
      const tx = await stakingContract.withdraw(stakeIndex);
      await tx.wait();
      return tx;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Claim accumulated rewards without unstaking
   */
  const claimRewards = async () => {
    if (!stakingContract) throw new Error('Staking contract not available');
    
    setIsLoading(true);
    try {
      const tx = await stakingContract.claimRewards();
      await tx.wait();
      return tx;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Emergency withdraw with 50% penalty
   */
  const emergencyWithdraw = async (stakeIndex) => {
    if (!stakingContract) throw new Error('Staking contract not available');
    
    setIsLoading(true);
    try {
      const tx = await stakingContract.emergencyWithdraw(stakeIndex);
      await tx.wait();
      return tx;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mint tokens to user's address - Add tokens to balance
   */
  const mintTokens = async (amount) => {
    if (!tokenContract) {
      throw new Error('Token contract not available');
    }
    if (!account) {
      throw new Error('Wallet not connected');
    }
    
    setIsLoading(true);
    try {
      console.log('Minting tokens...');
      const tx = await tokenContract.mint(account, amount);
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Tokens minted successfully!');
      return tx;
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    approveTokens,
    stake,
    withdraw,
    claimRewards,
    emergencyWithdraw,
    mintTokens,
    isLoading, // Components can show loading state while transactions process
  };
};
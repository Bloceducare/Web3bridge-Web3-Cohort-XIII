import { ethers } from 'ethers';
import StakingABI from '../contracts/StakingABI.json';
import { CONTRACT_ADDRESS } from '../contracts/config';

// Create contract instance with signer (for write operations)
export const getStakingContract = (signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, StakingABI, signer);
};

// Create contract instance with provider (for read-only operations)
export const getStakingContractReadOnly = (provider) => {
  log
  return new ethers.Contract(CONTRACT_ADDRESS, StakingABI, provider);
};

// Get user's stake details
export const getUserStakes = async (provider, userAddress) => {
  try {
    const contract = getStakingContractReadOnly(provider);
    const userDetails = await contract.getUserDetails(userAddress);
    
    // Format the data to match the expected structure in the components
    const formattedStake = {
      id: 1, // Since this contract only supports one stake per user
      amount: userDetails.stakedAmount,
      startTime: userDetails.lastStakeTimestamp,
      unlockTime: ethers.BigNumber.from(userDetails.lastStakeTimestamp).add(userDetails.timeUntilUnlock),
      canWithdraw: userDetails.canWithdraw
    };
    
    return userDetails.stakedAmount.gt(0) ? [formattedStake] : [];
  } catch (error) {
    console.error('Error getting user stakes:', error);
    return [];
  }
};

// Get pending rewards for a user
export const getPendingRewards = async (provider, userAddress) => {
  try {
    const contract = getStakingContractReadOnly(provider);
    const userDetails = await contract.getUserDetails(userAddress);
    return userDetails.pendingRewards;
  } catch (error) {
    console.error('Error getting pending rewards:', error);
    return ethers.BigNumber.from(0);
  }
};

// Get pending rewards for a specific stake (in this contract, user only has one stake)
export const getStakePendingRewards = async (provider, userAddress, stakeId) => {
  try {
    // Since this contract only supports one stake per user, we ignore stakeId
    return await getPendingRewards(provider, userAddress);
  } catch (error) {
    console.error('Error getting stake pending rewards:', error);
    return ethers.BigNumber.from(0);
  }
};

// Get total staked amount in the protocol
export const getTotalStaked = async (provider) => {
  try {
    const contract = getStakingContractReadOnly(provider);
    console.log(contract);
    
    
    const totalStaked = await contract.getTotalStaked();
    console.log(totalStaked);
    
    return totalStaked;
  } catch (error) {
    console.error('Error getting total staked:', error);
    throw error;
  }
};

// Get reward rate
export const getRewardRate = async (provider) => {
  try {
    const contract = getStakingContractReadOnly(provider);
    const rewardRate = await contract.getRewardRate();
    return rewardRate;
  } catch (error) {
    console.error('Error getting reward rate:', error);
    throw error;
  }
};

// Get APR
export const getAPR = async (provider) => {
  try {
    const contract = getStakingContractReadOnly(provider);
    const initialApr = await contract.initialApr();
    return initialApr;
  } catch (error) {
    console.error('Error getting APR:', error);
    return ethers.BigNumber.from(0);
  }
};

// Get total staked in the protocol (this contract doesn't have getAllStakes function)
export const getAllStakes = async (provider) => {
  try {
    const contract = getStakingContractReadOnly(provider);
    const totalStaked = await contract.totalStaked();
    
    // Since we can't get all individual stakes, we'll return a simplified representation
    // with just the total amount staked in the protocol
    const simplifiedStake = {
      id: 0,
      amount: totalStaked,
      startTime: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      unlockTime: ethers.BigNumber.from(0),
      isGlobal: true
    };
    
    return totalStaked.gt(0) ? [simplifiedStake] : [];
  } catch (error) {
    console.error('Error getting all stakes:', error);
    return [];
  }
};

// Stake tokens
export const stakeTokens = async (signer, amount) => {
  try {
    const contract = getStakingContract(signer);
    const tx = await contract.stake(amount);
    return tx;
  } catch (error) {
    console.error('Error staking tokens:', error);
    throw error;
  }
};

// Withdraw staked tokens
export const withdrawStake = async (signer, amount) => {
  try {
    const contract = getStakingContract(signer);
    const tx = await contract.withdraw(amount);
    return tx;
  } catch (error) {
    console.error('Error withdrawing stake:', error);
    throw error;
  }
};

// Claim rewards (in this contract, rewards are claimed during withdrawal)
// This function is kept for compatibility but will throw an error if called
export const claimRewards = async (signer) => {
  try {
    console.warn('This contract does not support separate reward claiming. Rewards are automatically claimed during withdrawal.');
    throw new Error('Separate reward claiming not supported');
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
};

// Emergency withdraw
export const emergencyWithdraw = async (signer, stakeId) => {
  try {
    const contract = getStakingContract(signer);
    const tx = await contract.emergencyWithdraw(stakeId);
    return tx;
  } catch (error) {
    console.error('Error emergency withdrawing:', error);
    throw error;
  }
};

// Format ethers to display with 4 decimal places
export const formatEther = (wei) => {
  if (!wei) return '0';
  return parseFloat(ethers.utils.formatEther(wei)).toFixed(4);
};

// Calculate time until unlock
export const calculateTimeUntilUnlock = (unlockTime) => {
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = unlockTime - now;
  
  if (timeLeft <= 0) return 'Unlocked';
  
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
};
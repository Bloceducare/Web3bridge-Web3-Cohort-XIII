import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { useAccount } from 'wagmi';
import { STAKING_CONTRACT_CONFIG, STAKE_TOKEN_CONFIG } from '../config/contracts';
import { useState } from 'react';
import { formatEther, parseEther } from 'viem';
import toast from 'react-hot-toast';

// Types
export interface UserDetails {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  pendingRewards: bigint;
  timeUntilUnlock: bigint;
  canWithdraw: boolean;
}

export interface UserInfo {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  rewardDebt: bigint;
  pendingRewards: bigint;
}

// Hook for reading user stake details
export function useUserStakeDetails() {
  const { address } = useAccount();
  
  const { data: userDetails, isLoading, refetch } = useReadContract({
    ...STAKING_CONTRACT_CONFIG,
    functionName: 'getUserDetails',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, 
    },
  });

  return {
    userDetails: userDetails as UserDetails | undefined,
    isLoading,
    refetch,
  };
}

// Hook for reading user token balance
export function useTokenBalance() {
  const { address } = useAccount();
  
  const { data: balance, isLoading, refetch } = useReadContract({
    ...STAKE_TOKEN_CONFIG,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  return {
    balance: balance as bigint | undefined,
    formattedBalance: balance ? formatEther(balance) : '0',
    isLoading,
    refetch,
  };
}

// Hook for reading token allowance
export function useTokenAllowance() {
  const { address } = useAccount();
  
  const { data: allowance, isLoading, refetch } = useReadContract({
    ...STAKE_TOKEN_CONFIG,
    functionName: 'allowance',
    args: address ? [address, STAKING_CONTRACT_CONFIG.address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  return {
    allowance: allowance as bigint | undefined,
    formattedAllowance: allowance ? formatEther(allowance) : '0',
    isLoading,
    refetch,
  };
}

// Hook for reading contract stats
export function useContractStats() {
  const { data: totalStaked, isLoading: totalStakedLoading, refetch: refetchTotalStaked } = useReadContract({
    ...STAKING_CONTRACT_CONFIG,
    functionName: 'totalStaked',
    query: {
      refetchInterval: 10000,
    },
  });

  const { data: currentRewardRate, isLoading: rewardRateLoading, refetch: refetchRewardRate } = useReadContract({
    ...STAKING_CONTRACT_CONFIG,
    functionName: 'currentRewardRate',
    query: {
      refetchInterval: 10000,
    },
  });

  return {
    totalStaked: totalStaked as bigint | undefined,
    formattedTotalStaked: totalStaked ? formatEther(totalStaked) : '0',
    currentRewardRate: currentRewardRate as bigint | undefined,
    formattedApr: currentRewardRate ? `${Number(currentRewardRate) / 100}%` : '0%',
    isLoading: totalStakedLoading || rewardRateLoading,
    refetch: () => {
      refetchTotalStaked();
      refetchRewardRate();
    },
  };
}

// Hook for staking operations
export function useStaking() {
  const { writeContract, isPending, error } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  const stake = async (amount: string) => {
    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      
      await writeContract({
        ...STAKING_CONTRACT_CONFIG,
        functionName: 'stake',
        args: [amountWei],
      });
      
      toast.success('Stake transaction submitted!');
    } catch (err) {
      console.error('Staking error:', err);
      toast.error('Failed to stake tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (amount: string) => {
    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      
      await writeContract({
        ...STAKING_CONTRACT_CONFIG,
        functionName: 'withdraw',
        args: [amountWei],
      });
      
      toast.success('Withdrawal transaction submitted!');
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error('Failed to withdraw tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const claimRewards = async () => {
    try {
      setIsLoading(true);
      
      await writeContract({
        ...STAKING_CONTRACT_CONFIG,
        functionName: 'claimRewards',
      });
      
      toast.success('Claim rewards transaction submitted!');
    } catch (err) {
      console.error('Claim rewards error:', err);
      toast.error('Failed to claim rewards');
    } finally {
      setIsLoading(false);
    }
  };

  const emergencyWithdraw = async () => {
    try {
      setIsLoading(true);
      
      await writeContract({
        ...STAKING_CONTRACT_CONFIG,
        functionName: 'emergencyWithdraw',
      });
      
      toast.success('Emergency withdrawal transaction submitted!');
    } catch (err) {
      console.error('Emergency withdrawal error:', err);
      toast.error('Failed to emergency withdraw');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stake,
    withdraw,
    claimRewards,
    emergencyWithdraw,
    isLoading: isLoading || isPending,
    error,
  };
}

// Hook for token approval
export function useTokenApproval() {
  const { writeContract, isPending, error } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  const approve = async (amount: string) => {
    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      
      await writeContract({
        ...STAKE_TOKEN_CONFIG,
        functionName: 'approve',
        args: [STAKING_CONTRACT_CONFIG.address, amountWei],
      });
      
      toast.success('Approval transaction submitted!');
    } catch (err) {
      console.error('Approval error:', err);
      toast.error('Failed to approve tokens');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    approve,
    isLoading: isLoading || isPending,
    error,
  };
}

// Hook for listening to contract events
export function useContractEvents() {
  const { address } = useAccount();
  const [events, setEvents] = useState<any[]>([]);

  // Listen to Staked events
  useWatchContractEvent({
    ...STAKING_CONTRACT_CONFIG,
    eventName: 'Staked',
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args.user === address) {
          toast.success(`Successfully staked ${formatEther(log.args.amount || 0n)} STK!`);
          setEvents(prev => [...prev, { type: 'stake', ...log.args }]);
        }
      });
    },
  });

  // Listen to Withdrawn events
  useWatchContractEvent({
    ...STAKING_CONTRACT_CONFIG,
    eventName: 'Withdrawn',
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args.user === address) {
          toast.success(`Successfully withdrawn ${formatEther(log.args.amount || 0n)} STK!`);
          setEvents(prev => [...prev, { type: 'withdraw', ...log.args }]);
        }
      });
    },
  });

  // Listen to RewardsClaimed events
  useWatchContractEvent({
    ...STAKING_CONTRACT_CONFIG,
    eventName: 'RewardsClaimed',
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args.user === address) {
          toast.success(`Successfully claimed ${formatEther(log.args.amount || 0n)} STK rewards!`);
          setEvents(prev => [...prev, { type: 'claim', ...log.args }]);
        }
      });
    },
  });

  // Listen to EmergencyWithdrawn events
  useWatchContractEvent({
    ...STAKING_CONTRACT_CONFIG,
    eventName: 'EmergencyWithdrawn',
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args.user === address) {
          toast.error(`Emergency withdrawal completed. Penalty: ${formatEther(log.args.penalty || 0n)} STK`);
          setEvents(prev => [...prev, { type: 'emergency', ...log.args }]);
        }
      });
    },
  });

  return { events };
}

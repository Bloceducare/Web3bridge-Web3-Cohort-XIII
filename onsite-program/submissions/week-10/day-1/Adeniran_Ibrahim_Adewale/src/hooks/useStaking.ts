import { CONTRACT_ABI, TOKEN_ABI } from '@/lib/abi';
import process from 'process';
import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';

type Position = {
  id: string;
  status: 'Active' | 'Inactive' | 'Pending';
  amount: string;
  reward: string;
  startTime: number;
  endTime: number;
};

type StakingEvents = {
  onStaked?: (position: Position) => void;
  onWithdrawn?: (positionId: string) => void;
  onError?: (error: Error) => void;
};

export function useStaking({ onStaked, onWithdrawn, onError }: StakingEvents = {}) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);  

  const fetchPositions = useCallback(async () => {
    if (!publicClient || !walletClient) return;
    
    try {
      setIsLoading(true);

      const userAddress = walletClient.account.address;
      

      // type UserDetails = {
      //   stakedAmount: bigint;
      //   lastStakeTimestamp: bigint;
      //   pendingRewards: bigint;
      //   timeUntilUnlock: bigint;
      //   canWithdraw: boolean;
      //   totalStaked: bigint;
      // };

      const userDetails = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI,
        functionName: 'getUserDetails',
        args: [userAddress],
      }) ;

console.log('userDetails: ', userDetails)


      // if (userDetails) {
      //   const position: Position = {
      //     id: userAddress,
      //     status: userDetails.stakedAmount > 0 ? 'Active' : 'Inactive',
      //     amount: userDetails.stakedAmount.toString(),
      //     reward: userDetails.pendingRewards.toString(),
      //     startTime: Number(userDetails.lastStakeTimestamp),
      //     endTime: Number(userDetails.timeUntilUnlock),
      //   };
      //   setPositions([position]);
      // }
      
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch positions');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, walletClient, onError]);

  useEffect(() => {
    if (!publicClient) return;
    
    fetchPositions();

  }, [publicClient, fetchPositions, onStaked, onWithdrawn]);

  const stake = useCallback(async (amount: string) => {
    if (!walletClient) throw new Error('No wallet connected');
    
    try {
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI,
        functionName: 'stake',
        args: [amount],
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      
      const newPosition: Position = {
        id: `mock-${Date.now()}`,
        status: 'Active',
        amount,
        reward: '0',
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor((Date.now() + 2592000000) / 1000), // 30 days
      };
      
      setPositions(prev => [...prev, newPosition]);
      onStaked?.(newPosition);
      
      return newPosition;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stake');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [walletClient, onStaked, onError, publicClient]);

  const withdraw = useCallback(async () => {
    if (!walletClient) throw new Error('No wallet connected');
    
    try {
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI,
        functionName: 'withdraw',
        args: [],
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      
      setPositions(prev => prev.filter(p => p.id !== walletClient.account.address));
      onWithdrawn?.(walletClient.account.address);
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to withdraw');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [walletClient, onWithdrawn, onError, publicClient]);

  const claimRewards = useCallback(async () => {
    if (!walletClient) throw new Error('No wallet connected');

    try {
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI,
        functionName: 'claimRewards',
        args: [],
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to claim rewards');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [walletClient, publicClient, onError]);

  const approve = useCallback(async (amount: string) => {
    if (!walletClient) throw new Error('No wallet connected');

    try {
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS as Address,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS, amount],
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to approve');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [walletClient, publicClient, onError]);

  return {
    positions,
    isLoading,
    error,
    stake,
    withdraw,
    approve,
    claimRewards,
    refreshPositions: fetchPositions,
  };
}
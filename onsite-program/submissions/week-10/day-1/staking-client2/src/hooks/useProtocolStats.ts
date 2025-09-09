import { useReadContract } from 'wagmi';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../config/contracts';
import { formatEther } from 'viem';
import type { ProtocolStats } from '../types/contracts';

export function useProtocolStats(): ProtocolStats & { isLoading: boolean } {
  const { data: totalStaked, isLoading: totalStakedLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
  });

  const { data: currentRewardRate, isLoading: rewardRateLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'currentRewardRate',
  });

  const { data: initialApr, isLoading: initialAprLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    // functionName: 'initialApr',
  });

  const { data: minLockDuration, isLoading: minLockLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    // functionName: 'minLockDuration',
  });

  return {
    totalStaked: totalStaked ? formatEther(totalStaked) : '0',
    currentRewardRate: currentRewardRate ? currentRewardRate.toString() : '0',
    initialApr: initialApr ? initialApr.toString() : '0',
    minLockDuration: minLockDuration ? minLockDuration.toString() : '0',
    isLoading: totalStakedLoading || rewardRateLoading || initialAprLoading || minLockLoading
  };
}
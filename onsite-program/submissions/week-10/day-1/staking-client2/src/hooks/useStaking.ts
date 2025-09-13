import { useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../config/contracts';

export function useStaking() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const stake = useCallback(async (amount: string) => {
    try {
      await writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [parseEther(amount)],
      });
      toast.success('Stake transaction submitted');
    } catch (error: any) {
      toast.error('Stake failed: ' + error.message);
    }
  }, [writeContract]);

  const withdraw = useCallback(async (amount: string) => {
    try {
      await writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'withdraw',
        args: [parseEther(amount)],
      });
      toast.success('Withdraw transaction submitted');
    } catch (error: any) {
      toast.error('Withdraw failed: ' + error.message);
    }
  }, [writeContract]);

  const claimRewards = useCallback(async () => {
    try {
      await writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'claimRewards',
      });
      toast.success('Claim rewards transaction submitted');
    } catch (error: any) {
      toast.error('Claim failed: ' + error.message);
    }
  }, [writeContract]);

  const emergencyWithdraw = useCallback(async () => {
    try {
      await writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'emergencyWithdraw',
      });
      toast.success('Emergency withdraw transaction submitted');
    } catch (error: any) {
      toast.error('Emergency withdraw failed: ' + error.message);
    }
  }, [writeContract]);

  return {
    stake,
    withdraw,
    claimRewards,
    emergencyWithdraw,
    isPending: isPending || isConfirming,
    hash
  };
}
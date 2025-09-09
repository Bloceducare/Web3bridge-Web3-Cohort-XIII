import { useReadContract, useAccount } from 'wagmi';
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS, STAKING_ABI, TOKEN_ABI } from '../config/contracts';
import { formatEther } from 'viem';
import type { UserData } from '../types/contracts';

export function useUserData(): UserData & { isLoading: boolean } {
  const { address } = useAccount();

  const { data: userDetails, isLoading: userDetailsLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getUserDetails',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  console.log('user details: ', userDetails)
  const { data: tokenBalance, isLoading: balanceLoading } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: allowance, isLoading: allowanceLoading } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, STAKING_CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address }
  });

  return {
    stakedAmount: userDetails ? formatEther(userDetails.stakedAmount) : '0',
    pendingRewards: userDetails ? formatEther(userDetails.pendingRewards) : '0',
    timeUntilUnlock: userDetails ? Number(userDetails.timeUntilUnlock) : 0,
    canWithdraw: userDetails ? userDetails.canWithdraw : false,
    tokenBalance: tokenBalance ? formatEther(tokenBalance) : '0',
    allowance: allowance ? formatEther(allowance) : '0',
    isLoading: userDetailsLoading || balanceLoading || allowanceLoading
  };
}
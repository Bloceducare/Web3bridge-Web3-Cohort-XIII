import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  STAKING_CONTRACT_ABI,
  STAKING_CONTRACT_ADDRESS,
} from "../config/contract";
import { parseEther } from "viem";

// ---------- Types ----------
export interface UserDetailsStruct {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  pendingRewards: bigint;
  timeUntilUnlock: bigint;
  canWithdraw: boolean;
}

// ---------- Write hooks ----------
export function useStakingContract() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const stake = (amount: string) => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: "stake",
      args: [parseEther(amount)],
    });
  };

  const withdraw = (amount: string) => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: "withdraw",
      args: [parseEther(amount)],
    });
  };

  const claimRewards = () => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: "claimRewards",
    });
  };

  const emergencyWithdraw = () => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: "emergencyWithdraw",
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return {
    stake,
    withdraw,
    claimRewards,
    emergencyWithdraw,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// ---------- Read hooks ----------
export function useUserDetails(address: `0x${string}` | undefined) {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getUserDetails",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as { data: UserDetailsStruct | undefined };
}


export function usePendingRewards(address: `0x${string}` | undefined) {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getPendingRewards",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as { data: bigint | undefined };
}

export function useTimeUntilUnlock(address: `0x${string}` | undefined) {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getTimeUntilUnlock",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as { data: bigint | undefined };
}

export function useTotalStaked() {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "totalStaked",
  }) as { data: bigint | undefined };
}

export function useCurrentRewardRate() {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "currentRewardRate",
  }) as { data: bigint | undefined };
}

export function useInitialApr() {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "initialApr",
  }) as { data: bigint | undefined };
}

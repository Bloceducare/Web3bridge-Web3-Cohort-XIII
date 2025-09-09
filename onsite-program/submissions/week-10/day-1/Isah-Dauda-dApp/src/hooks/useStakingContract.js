import { useReadContract, useWriteContract } from "wagmi";
import { useTransactionHistory } from "./useTransactionHistory.js";
import { STAKING_CONTRACT_ADDRESS } from "../utils/constants.js";
import { STAKING_ABI } from "../utils/abis.js";
import { useEffect } from "react";

/**
 * Hook for reading from the staking contract
 */
export function useStakingContract() {
  const {
    writeContract,
    isPending,
    isSuccess,
    isError,
    error,
    data: hash,
  } = useWriteContract();
  const { addTransaction } = useTransactionHistory();

  const stake = (amount) => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: "stake",
      args: [amount],
    });
  };

  const withdraw = (amount) => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: "withdraw",
      args: [amount],
    });
  };

  const claimRewards = () => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: "claimRewards",
    });
  };

  const emergencyWithdraw = () => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: "emergencyWithdraw",
    });
  };

  // Track successful transactions
  useEffect(() => {
    if (isSuccess && hash) {
      // Note: In a real implementation, you'd want to parse the transaction
      // to get the actual amounts. For now, we'll add placeholders.
      console.log("Transaction successful:", hash);
    }
  }, [isSuccess, hash, addTransaction]);

  return {
    stake,
    withdraw,
    claimRewards,
    emergencyWithdraw,
    isPending,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for reading user details from the staking contract
 */
export function useUserDetails(address) {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "userInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });
}

/**
 * Hook for reading pending rewards
 */
export function usePendingRewards(address) {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "getPendingRewards",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });
}

/**
 * Hook for reading time until unlock
 */
export function useTimeUntilUnlock(address) {
  return useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "getTimeUntilUnlock",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });
}

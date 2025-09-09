import { useReadContract, useWriteContract } from "wagmi";
import {
  TOKEN_CONTRACT_ADDRESS,
  STAKING_CONTRACT_ADDRESS,
} from "../utils/constants.js";
import { ERC20_ABI } from "../utils/abis.js";

/**
 * Hook for token contract interactions
 */
export function useTokenContract() {
  const { writeContract, isPending, isSuccess, isError, error } =
    useWriteContract();

  const approve = (amount) => {
    writeContract({
      address: TOKEN_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [STAKING_CONTRACT_ADDRESS, amount],
    });
  };

  return {
    approve,
    isPending,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Hook for reading token balance
 */
export function useTokenBalance(address) {
  return useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });
}

/**
 * Hook for reading token allowance
 */
export function useTokenAllowance(address) {
  return useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, STAKING_CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });
}

/**
 * Hook for reading token decimals
 */
export function useTokenDecimals() {
  return useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      refetchInterval: false, // Decimals don't change
    },
  });
}

/**
 * Hook for reading token symbol
 */
export function useTokenSymbol() {
  return useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: {
      refetchInterval: false, // Symbol doesn't change
    },
  });
}

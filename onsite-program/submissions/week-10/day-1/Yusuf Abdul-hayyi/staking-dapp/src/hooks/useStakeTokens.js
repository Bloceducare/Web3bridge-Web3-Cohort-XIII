import { useCallback } from "react";
import { useAccount, useWalletClient, useWriteContract, usePublicClient } from "wagmi";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { STAKING_CONTRACT_ABI, STAKING_TOKEN_ABI } from "../config/ABI";

export default function useStakeTokens() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const walletClient = useWalletClient();
  const publicClient = usePublicClient();

  const stake = useCallback(
    async (amount) => {
      if (!address || !walletClient) {
        toast.error("Connect wallet first");
        return;
      }

      try {
        // Read staking token address and decimals
        const stakingTokenAddress = await publicClient.readContract({
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKING_CONTRACT_ABI,
          functionName: "stakingToken",
        });

        const tokenDecimals = await publicClient.readContract({
          address: stakingTokenAddress,
          abi: STAKING_TOKEN_ABI,
          functionName: "decimals",
        });

        // Parse input amount to base units
        const parsedAmount = parseUnits(String(amount), tokenDecimals);

        // Check user token balance
        const userBalance = await publicClient.readContract({
          address: stakingTokenAddress,
          abi: STAKING_TOKEN_ABI,
          functionName: "balanceOf",
          args: [address],
        });

        if (parsedAmount <= 0n) {
          toast.error("Invalid amount");
          return;
        }

        if (userBalance < parsedAmount) {
          toast.error("Insufficient token balance");
          return;
        }

        const txHash = await writeContractAsync({
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKING_CONTRACT_ABI,
          functionName: "stake",
          args: [parsedAmount],
        });

        await walletClient.waitForTransactionReceipt({ hash: txHash });
        toast.success("Staked successfully");
      } catch (err) {
        toast.error("Staking failed");
        console.error(err);
      }
    },
    [address, walletClient, writeContractAsync, publicClient]
  );

  return { stake };
}

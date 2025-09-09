import { useCallback } from "react";
import { useAccount, useWalletClient, useWriteContract, usePublicClient } from "wagmi";
import { toast } from "sonner";
import { STAKING_CONTRACT_ABI } from "../config/ABI";

export default function useUnstakeTokens() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const walletClient = useWalletClient();
  const publicClient = usePublicClient();

  const withdraw = useCallback(
    async (amount) => {
      if (!address || !walletClient) {
        toast.error("Connect wallet first");
        return;
      }

      try {
        // Read user staked amount
        const userDetails = await publicClient.readContract({
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKING_CONTRACT_ABI,
          functionName: "getUserDetails",
          args: [address],
        });

        const requested = BigInt(amount);
        const staked = userDetails?.stakedAmount ?? 0n;

        if (requested <= 0n) {
          toast.error("Invalid amount");
          return;
        }

        if (requested > staked) {
          toast.error("Amount exceeds staked balance");
          return;
        }

        const txHash = await writeContractAsync({
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKING_CONTRACT_ABI,
          functionName: "withdraw",
          args: [requested],
        });

        const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status === "success") toast.success("Withdraw successful");
        else toast.error("Withdraw failed");
      } catch (err) {
        toast.error("Withdraw failed");
        console.error(err);
      }
    },
    [address, walletClient, writeContractAsync, publicClient]
  );

  return { withdraw };
}

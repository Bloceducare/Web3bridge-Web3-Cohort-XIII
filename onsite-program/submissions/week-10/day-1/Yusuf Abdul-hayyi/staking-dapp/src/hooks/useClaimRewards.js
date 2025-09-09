import React, { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { STAKING_CONTRACT_ABI } from "../config/ABI";

const useClaimRewards = () => {
  const { address } = useAccount();
  const walletClient = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(
    async () => {
      if (!address || !walletClient) {
        toast.error("Not connected", { description: "Please connect your wallet" });
        return;
      }

      try {
        const txHash = await writeContractAsync({
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKING_CONTRACT_ABI,
          functionName: "claimRewards",
          args: [],
        });

        const txReceipt = await walletClient.waitForTransactionReceipt({ hash: txHash });

        if (txReceipt.status === "success") {
          toast.success("Rewards claimed", { description: "Your rewards are in your wallet" });
        } else {
          toast.error("Claim failed");
        }
      } catch (error) {
        console.error(error);
        toast.error("Claim failed", { description: error?.message || "Something went wrong" });
      }
    },
    [address, walletClient, writeContractAsync]
  );
};

export default useClaimRewards;

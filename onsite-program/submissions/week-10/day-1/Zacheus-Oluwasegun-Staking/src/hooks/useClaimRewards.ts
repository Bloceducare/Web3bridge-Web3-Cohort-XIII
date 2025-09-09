import { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { STAKING_CONTRACT_ABI } from "../config/staking_contract_abi";

const useClaimRewards = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(async (): Promise<void> => {
    if (!address || !publicClient) {
      toast.error("Not connected", {
        description: "Please connect your wallet",
      });
      return;
    }

    try {
      const claimHash = await writeContractAsync({
        address: import.meta.env.VITE_STAKING_CONTRACT as `0x${string}`,
        abi: STAKING_CONTRACT_ABI,
        functionName: "claimRewards",
        args: [],
      });

      console.log("Claim rewards txHash:", claimHash);

      const claimReceipt = await publicClient.waitForTransactionReceipt({
        hash: claimHash,
      });

      if (claimReceipt.status === "success") {
        toast.success("Rewards claimed successfully", {
          description: "Your rewards have been transferred to your wallet",
        });
      } else {
        toast.error("Claim failed", {
          description: "Transaction was not successful",
        });
      }
    } catch (error: any) {
      console.error("Claim rewards error:", error);

    if (error?.message?.includes("Pausable: paused")) {
        toast.error("Contract paused", {
          description: "Staking contract is currently paused",
        });
      } else {
        toast.error("Claim failed", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    }
  }, [address, publicClient, writeContractAsync]);
};

export default useClaimRewards;

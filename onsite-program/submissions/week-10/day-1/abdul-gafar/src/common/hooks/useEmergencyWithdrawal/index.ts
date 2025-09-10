import { STACKING_CONTRACT } from "@/common/abi";
import { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useWatchAllEvent } from "../useWatchAllEvent";

const useEmergencyWithdraw = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(async () => {
    if (!address) {
      toast.error("Not Connected", {
        description: "Please connect your wallet first.",
      });
      return;
    }

    const contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as
      | `0x${string}`
      | undefined;

    if (!contractAddress) {
      toast.error("Contract address not set", {
        description: "NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS is undefined",
      });
      return;
    }

    if (!publicClient) {
      toast.error("Public client not available");
      return;
    }

    const confirmed = confirm(
      "Emergency withdraw will forfeit all rewards and apply a 50% penalty. Are you sure?"
    );

    if (!confirmed) return;

    try {
      const emergencyHash = await writeContractAsync({
        address: contractAddress,
        abi: STACKING_CONTRACT,
        functionName: "emergencyWithdraw",
      });

      console.log("Emergency withdraw txHash: ", emergencyHash);

      const emergencyReceipt = await publicClient.waitForTransactionReceipt({
        hash: emergencyHash,
      });

      if (emergencyReceipt.status === "success") {
        useWatchAllEvent();
        toast.success("Emergency withdrawal successful", {
          description:
            "Tokens withdrawn with penalty applied. All rewards forfeited.",
        });
      } else {
        toast.error("Emergency withdrawal failed", {
          description: "Emergency withdrawal transaction failed",
        });
      }
    } catch (error) {
      console.error("Emergency withdraw error:", error);
      toast.error("Transaction failed", {
        description: "Something went wrong during emergency withdrawal",
      });
    }
  }, [address, publicClient, writeContractAsync]);
};

export default useEmergencyWithdraw;

import { STACKING_CONTRACT } from "@/common/abi";
import { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from "wagmi";


const useEmergencyWithdraw = () => {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const walletClient = useWalletClient();
    const { writeContractAsync } = useWriteContract();



  return useCallback(
    async () => {
        if (!address || !walletClient) {
            toast.error("Not Connected", {
                description: "connect wallet"
            });
            return;
        }

        const contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS;

        if (!contractAddress) {
            toast.error("Contract address not set", {
                description: "NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS is undefined"
            });
            throw new Error("NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS is undefined");
        }

        if (!publicClient) {
            toast.error("Public client not available");
            throw new Error("Public client is undefined");
        }

        const confirmed = confirm(
            "Emergency withdraw will forfeit all rewards and apply a 50% penalty. Are you sure?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const emergencyHash = await writeContractAsync({
                address: contractAddress as `0x${string}`,
                abi: STACKING_CONTRACT,
                functionName: "emergencyWithdraw",
                args: [],
            });

            console.log("Emergency withdraw txHash: ", emergencyHash);

            const emergencyReceipt = await publicClient.waitForTransactionReceipt({
                hash: emergencyHash,
            });

            if (emergencyReceipt.status === "success") {
                toast.success("Emergency withdrawal successful", {
                    description: "Tokens withdrawn with penalty applied. All rewards forfeited.",
                });
            } else {
                toast.error("Emergency withdrawal failed", {
                    description: "Emergency withdrawal transaction failed",
                });
            }

        } catch (error) {
            console.error("Emergency withdraw error:", error);
            toast.error("Transaction failed", {
                description: "Something went wrong during emergency withdrawal"
            });
        }
    },
    [address, walletClient, publicClient, writeContractAsync]
);
}

export default useEmergencyWithdraw;

import { STACKING_CONTRACT } from "@/common/abi";
import { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from "wagmi";



const useClaimRewards = () => {

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const { writeContractAsync } = useWriteContract();


return useCallback(
    async () => {
        if (!address || !walletClient) {
            toast.error("Not Connected", {
                description: "Ode!, connect wallet"
            });
            return;
        }

        const contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS;

        if (!contractAddress) {
            toast.error("Contract address not set", {
                description: "no contract is defined"
            });
            throw new Error("no contract is defined");
        }

        if (!publicClient) {
            toast.error("Public client not available");
            throw new Error("Public client is undefined");
        }

        try {
            // Call claimRewards function (no parameters needed)
            const claimHash = await writeContractAsync({
                address: contractAddress as `0x${string}`,
                abi: STACKING_CONTRACT,
                functionName: "claimRewards",
                args: [],
            });

            console.log("Claim txHash: ", claimHash);

            const claimReceipt = await publicClient.waitForTransactionReceipt({
                hash: claimHash,
            });

            if (claimReceipt.status === "success") {
                toast.success("Rewards claimed successfully", {
                    description: "Your rewards have been transferred to your wallet",
                });
            } else {
                toast.error("Claim failed", {
                    description: "Reward claim transaction failed",
                });
            }

        } catch (error) {
            console.error("Claim error:", error);
            toast.error("Transaction failed", {
                description: "Something went wrong while claiming rewards"
            });
        }
    },
    [address, walletClient, publicClient, writeContractAsync]
);

}

export default useClaimRewards;
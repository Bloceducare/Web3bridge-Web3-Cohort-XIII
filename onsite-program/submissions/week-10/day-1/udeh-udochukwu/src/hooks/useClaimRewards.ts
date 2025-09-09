import { contractAbi} from "../config/abi";
import React, { useCallback } from "react";
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
                description: "NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS is undefined"
            });
            throw new Error("NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS is undefined");
        }

        if (!publicClient) {
            toast.error("Public client not available");
            throw new Error("Public client is undefined");
        }

        try {
            // Call claimRewards function (no parameters needed)
            const claimHash = await writeContractAsync({
                address: contractAddress as `0x${string}`,
                abi: contractAbi,
                functionName: "claimRewards",
                args: [], // No arguments needed
            });

            console.log("Claim txHash: ", claimHash);

            // Wait for transaction confirmation
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




export default useClaimRewards
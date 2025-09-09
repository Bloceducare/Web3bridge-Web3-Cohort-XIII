import { contractAbi, tokenAbi } from "../config/abi";
import React, { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from "wagmi";


const useWithdraw = () => {

     const { address } = useAccount();
        const publicClient = usePublicClient();
        const walletClient = useWalletClient();
        const { writeContractAsync } = useWriteContract();

  return useCallback(
    async (amount: number) => {
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
            // Convert amount to wei (assuming 18 decimals)
            const amountInWei = BigInt(amount * 10**18);

            // Call withdraw function
            const withdrawHash = await writeContractAsync({
                address: contractAddress as `0x${string}`,
                abi: contractAbi,
                functionName: "withdraw",
                args: [amountInWei],
            });

            console.log("Withdraw txHash: ", withdrawHash);

            // Wait for transaction confirmation
            const withdrawReceipt = await publicClient.waitForTransactionReceipt({
                hash: withdrawHash,
            });

            if (withdrawReceipt.status === "success") {
                toast.success("Withdrawal successful", {
                    description: "You have successfully withdrawn your tokens",
                });
            } else {
                toast.error("Withdrawal failed", {
                    description: "Withdrawal transaction failed",
                });
            }

        } catch (error) {
            console.error("Withdrawal error:", error);
            toast.error("Transaction failed", {
                description: "Something went wrong during withdrawal"
            });
        }
    },
    [address, walletClient, publicClient, writeContractAsync]
);
}

export default useWithdraw
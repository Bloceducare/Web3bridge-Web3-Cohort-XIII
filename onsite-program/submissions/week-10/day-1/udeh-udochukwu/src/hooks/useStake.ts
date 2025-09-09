import { contractAbi, tokenAbi } from "../config/abi";
import React, { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from "wagmi";


const useStake = () => {
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
        const tokenAddress = process.env.NEXT_PUBLIC_STAKING_TOKEN_ADDRESS;
        
        if (!contractAddress) {
            toast.error("Contract address not set", {
                description: "NEXT_STAKING_CONTRACT_ADDRESS is undefined"
            });
            throw new Error("NEXT_STAKING_CONTRACT_ADDRESS is undefined");
        }

        if (!tokenAddress) {
            toast.error("Token address not set", {
                description: "NEXT_STAKING_TOKEN_ADDRESS is undefined"
            });
            throw new Error("NEXT_STAKING_TOKEN_ADDRESS is undefined");
        }

        if (!publicClient) {
            toast.error("Public client not available");
            throw new Error("Public client is undefined");
        }

        try {
            // Convert amount to wei (assuming 18 decimals)
            const amountInWei = BigInt(amount * 10**18);

            // Step 1: Approve tokens
            const approveHash = await writeContractAsync({
                address: tokenAddress as `0x${string}`,
                abi:  tokenAbi,
                functionName: "approve",
                args: [contractAddress, amountInWei],
            });

            console.log("Approve txHash: ", approveHash);

            // Wait for approval
            const approveReceipt = await publicClient.waitForTransactionReceipt({
                hash: approveHash,
            });

            if (approveReceipt.status !== "success") {
                toast.error("Approval failed", {
                    description: "Token approval transaction failed"
                });
                return;
            }

            // Step 2: Stake tokens
            const stakeHash = await writeContractAsync({
                address: contractAddress as `0x${string}`,
                abi: contractAbi,
                functionName: "stake",
                args: [amountInWei],
            });

            console.log("Stake txHash: ", stakeHash);

            // Wait for stake transaction
            const stakeReceipt = await publicClient.waitForTransactionReceipt({
                hash: stakeHash,
            });

            if (stakeReceipt.status === "success") {
                toast.success("Staking successful", {
                    description: "You have successfully staked your tokens",
                });
            } else {
                toast.error("Staking failed", {
                    description: "Staking transaction failed",
                });
            }

        } catch (error) {
            console.error("Staking error:", error);
            toast.error("Transaction failed", {
                description: "Something went wrong during staking"
            });
        }
    },
    [address, walletClient, publicClient, writeContractAsync]
);

    
};


export default useStake
import { STACKING_CONTRACT, STAKING_CONTRACT_TOKEN } from "@/common/abi";
import { publicClient } from "@/common/constant";
import { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";


const useStake = () => {
  const { address } = useAccount();
  const walletClient = useWalletClient();
  const { writeContractAsync } = useWriteContract();


 return useCallback(
    async (amount: number) => {
        if (!address || !walletClient) {
            toast.error("Not Connected", {
                description: "connect wallet"
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
            const amountInWei = BigInt(amount * 10**18);

            // const simulatetransaction = await publicClient.simulateContract({
            //     abi: STAKING_CONTRACT_TOKEN,
            //     address: tokenAddress as `0x${string}`,
            //     functionName: 'approve',
            //     args: [contractAddress, amountInWei]
            // })
            // console.log("Simulate calllll", simulatetransaction);

            const approveHash = await writeContractAsync({
                address: tokenAddress as `0x${string}`,
                abi:  STAKING_CONTRACT_TOKEN,
                functionName: "approve",
                args: [contractAddress, amountInWei],
            });

            console.log("Approve txHash: ", approveHash);

            const approveReceipt = await publicClient.waitForTransactionReceipt({
                hash: approveHash,
            });

            if (approveReceipt.status !== "success") {
                toast.error("Approval failed", {
                    description: "Token approval transaction failed"
                });
                return;
            }

            const stakeHash = await writeContractAsync({
                address: contractAddress as `0x${string}`,
                abi: STACKING_CONTRACT,
                functionName: "stake",
                args: [amountInWei],
            });

            console.log("Stake txHash: ", stakeHash);

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

export default useStake;
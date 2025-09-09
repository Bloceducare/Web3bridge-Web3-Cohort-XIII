import { useCallback } from "react";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { parseUnits } from "viem";
import { STAKE_TOKEN_ABI } from "../config/stake_token_abi";
import { STAKING_CONTRACT_ABI } from "../config/staking_contract_abi";
import useTokenDetails from "./useGetTokenDetails";

const useStakeToken = () => {
  const { address } = useAccount();
  const walletClient = useWalletClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { userBal, allowance } = useTokenDetails();

  return useCallback(
    async (amount: string): Promise<void> => {
      if (!address || !walletClient.data) {
        toast.error("Not connected", {
          description: "Please connect your wallet",
        });
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        toast.error("Invalid amount", {
          description: "Please enter a valid amount to stake",
        });
        return;
      }

      try {
        if (!publicClient) return;

        const amountInWei = Number(amount);
        
        if (userBal && amountInWei > userBal) {
          toast.error("Insufficient balance", {
            description: "You don't have enough tokens to stake this amount",
          });
          return;
        }

        if (!allowance || allowance < amountInWei) {
          toast.info("Approval required", {
            description: "Please approve tokens for staking first",
          });
          
          const approveHash = await writeContractAsync({
            address: import.meta.env.VITE_STAKE_TOKEN as `0x${string}`,
            abi: STAKE_TOKEN_ABI,
            functionName: "approve",
            args: [
              import.meta.env.VITE_STAKING_CONTRACT as `0x${string}`,
              parseUnits(amountInWei.toString(), 18),
            ],
          });

          const approveReceipt = await publicClient.waitForTransactionReceipt({
            hash: approveHash,
          });

          if (approveReceipt.status !== "success") {
            toast.error("Approval failed", {
              description: "Token approval was not successful",
            });
            return;
          }

          toast.success("Approval successful", {
            description: "Tokens approved, now proceeding to stake",
          });
        }
        
        const stakeHash = await writeContractAsync({
          address: import.meta.env
            .VITE_STAKING_CONTRACT as `0x${string}`,
          abi: STAKING_CONTRACT_ABI,
          functionName: "stake",
          args: [parseUnits(amountInWei.toString(), 18)],
        });

        console.log("Stake txHash:", stakeHash);

        const stakeReceipt = await publicClient.waitForTransactionReceipt({
          hash: stakeHash,
        });

        if (stakeReceipt.status === "success") {
          toast.success("Staking successful", {
            description: `Successfully staked ${amount} tokens`,
          });
        } else {
          toast.error("Staking failed", {
            description: "Transaction was not successful",
          });
        }
      } catch (error) {
        console.error("Staking error:", error);
        toast.error("Staking failed", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    },
    [
      address,
      walletClient.data,
      publicClient,
      writeContractAsync,
      userBal,
      allowance,
    ]
  );
};

export default useStakeToken;

import { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { STAKING_CONTRACT_ABI } from "../config/staking_contract_abi";

const useWithdraw = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const withdrawCallback = useCallback(
    async (amount: string): Promise<void> => {
      if (!address || !publicClient) {
        toast.error("Not connected", {
          description: "Please connect your wallet",
        });
        return;
      }

      try {
        const amountInWei = parseUnits(amount, 18)

        const withdrawHash = await writeContractAsync({
          address: import.meta.env.VITE_STAKING_CONTRACT as `0x${string}`,
          abi: STAKING_CONTRACT_ABI,
          functionName: "withdraw",
          args: [amountInWei],
        });

        const withdrawReceipt = await publicClient.waitForTransactionReceipt({
          hash: withdrawHash,
        });

        if (withdrawReceipt.status === "success") {
          toast.success("Withdrawal successful", {
            description: `Successfully withdrew ${amount} tokens`,
          });
        } else {
          toast.error("Withdrawal failed", {
            description: "Transaction was not successful",
          });
        }
      } catch (error: any) {
        console.error("Withdraw error:", error);

        toast.error("Withdrawal failed", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    },
    [address, publicClient, writeContractAsync]
  );

  return { withdraw: withdrawCallback, isWithdrawing: isPending };
};

export default useWithdraw;

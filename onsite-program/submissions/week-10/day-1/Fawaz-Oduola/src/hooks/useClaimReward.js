import React, { useCallback} from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { STAKING_CONTRACT_ABI } from "../config/ABI";

export function useClaimReward() {
  const publicClient = usePublicClient();
  const {data, status} = useWalletClient();

  const claim = useCallback(
    async () => {
      if (!publicClient) return;
      if (status !== "success") {
        toast.error("Wallet not connected");
        return;

      }

      try {
        const simulateClaim = await publicClient.simulateCalls({
          account: data.account.address,
          calls: [
          
            {
              to: import.meta.env.VITE_STAKING_CONTRACT,
              abi: STAKING_CONTRACT_ABI,
              functionName: "claimRewards",
            },
          ],
        });

        if (simulateClaim.results[0].status === "failure") {
          toast.error("Withdrawal will fail", {
            description: simulateClaim.results[0].error.cause?.reason,
          });
          return;
        }

       

        const claimTx = await data.writeContract({
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKING_CONTRACT_ABI,
          functionName: "claimRewards",
        });

        const claimReceipt = await publicClient.waitForTransactionReceipt({
          hash: claimTx,
        });

        if (claimReceipt.status !== "success") {
          toast.error("Staking failed", {
            description: "Transaction reverted",
          });
        } else {
          toast.success("Withdraw successful", {
            description: `Successfully claimed  tokens`,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Unexpected error", {
          description: err.shortMessage || err.message,
        });
      }
    },
    [publicClient, data, status] 
  );

  return { claim, status };
}
export default useClaimReward;

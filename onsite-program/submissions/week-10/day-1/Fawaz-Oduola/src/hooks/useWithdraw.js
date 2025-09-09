import React, { useCallback} from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { toast } from "sonner";
// import { walletClient, account } from "../config/viemConfig";

import { STAKING_CONTRACT_ABI, STAKING_TOKEN_ABI } from "../config/ABI";
import { parseEther } from "viem";

export function useWithdraw() {
  const publicClient = usePublicClient();
  const {data, status} = useWalletClient();

  const withdraw = useCallback(
    async (amount) => {
      if (!publicClient) return;
      if (status !== "success") {
        toast.error("Wallet not connected");
        return;
      }

      try {
        const simulateStake = await publicClient.simulateCalls({
          account: data.account.address,
          calls: [
          
            {
              to: import.meta.env.VITE_STAKING_CONTRACT,
              abi: STAKING_CONTRACT_ABI,
              functionName: "withdraw",
              args: [parseEther(String(amount))],
            },
          ],
        });

        if (simulateStake.results[0].status === "failure") {
          toast.error("Withdrawal will fail", {
            description: simulateStake.results[0].error.cause?.reason,
          });
          return;
        }

       

        const withdrawTx = await data.writeContract({
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKING_CONTRACT_ABI,
          functionName: "withdraw",
          args: [parseEther(String(amount))],
        });

        const withdrawReceipt = await publicClient.waitForTransactionReceipt({
          hash: withdrawTx,
        });

        if (withdrawReceipt.status !== "success") {
          toast.error("Staking failed", {
            description: "Transaction reverted",
          });
        } else {
          toast.success("Withdraw successful", {
            description: `Successfully staked ${amount} tokens`,
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

  return { withdraw, status };
}
export default useWithdraw;

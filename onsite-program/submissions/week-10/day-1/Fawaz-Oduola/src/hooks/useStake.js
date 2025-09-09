import React, { useCallback} from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { toast } from "sonner";
// import { walletClient, account } from "../config/viemConfig";

import { STAKING_CONTRACT_ABI, STAKING_TOKEN_ABI } from "../config/ABI";
import { parseEther } from "viem";

export function useStake() {
  const publicClient = usePublicClient();
  const {data, status} = useWalletClient();

  const stake = useCallback(
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
              to: import.meta.env.VITE_STAKING_TOKEN,
              abi: STAKING_TOKEN_ABI,
              functionName: "approve",
              args: [import.meta.env.VITE_STAKING_CONTRACT, parseEther(String(amount))],
            },
            {
              to: import.meta.env.VITE_STAKING_CONTRACT,
              abi: STAKING_CONTRACT_ABI,
              functionName: "stake",
              args: [parseEther(String(amount))],
            },
          ],
        });

        

        if (simulateStake.results[0].status === "failure") {
          toast.error("Staking will fail", {
            description: simulateStake.results[0].error.cause?.reason,
          });
          return;
        }

        const approveTx = await data.writeContract({
          address: import.meta.env.VITE_STAKING_TOKEN,
          abi: STAKING_TOKEN_ABI,
          functionName: "approve",
          args: [import.meta.env.VITE_STAKING_CONTRACT, parseEther(String(amount))],
        });

        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveTx,
        });

        if (approveReceipt.status !== "success") {
          toast.error("Approval failed", {
            description: "Transaction reverted",
          });
          return;
        }

        const stakeTx = await data.writeContract({
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKING_CONTRACT_ABI,
          functionName: "stake",
          args: [parseEther(String(amount))],
        });

        const stakeReceipt = await publicClient.waitForTransactionReceipt({
          hash: stakeTx,
        });

        if (stakeReceipt.status !== "success") {
          toast.error("Staking failed", {
            description: "Transaction reverted",
          });
        } else {
          toast.success("Staking successful", {
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

  return { stake, status };
}
export default useStake;

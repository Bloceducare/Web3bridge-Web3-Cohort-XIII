import React from "react";
import { contractData, publicClient } from "@/config/config";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";

function useWithdraw() {
  const { address: account } = useAccount();

  const { writeContract } = useWriteContract();

  return React.useCallback(
    async (amount: string) => {
      const { request } = await publicClient.simulateContract({
        address: contractData.contractAddress,
        abi: contractData.contractABI,
        functionName: "withdraw",
        args: [parseEther(amount)],
        account,
      });

      writeContract(request);
    },
    [account, writeContract],
  );
}

export default useWithdraw;

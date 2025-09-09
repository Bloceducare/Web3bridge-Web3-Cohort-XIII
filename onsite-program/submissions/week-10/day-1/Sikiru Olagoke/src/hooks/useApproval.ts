import React from "react";
import { contractData, publicClient, tokenData } from "@/config/config";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";

function useApproval() {
  const { address: account } = useAccount();
  const { writeContract } = useWriteContract();

  return React.useCallback(
    async (amount: string) => {
      const { request } = await publicClient.simulateContract({
        address: tokenData.tokenAddress,
        abi: tokenData.tokenABI,
        functionName: "approve",
        args: [contractData.contractAddress, parseEther(amount)],
        account,
      });

      writeContract(request);
    },
    [account, writeContract],
  );
}

export default useApproval;

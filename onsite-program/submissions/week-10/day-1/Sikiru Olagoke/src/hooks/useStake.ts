import React from "react";
import { contractData, publicClient } from "@/config/config";
import { useAccount, useWriteContract } from "wagmi";
import { getAddress, parseEther } from "viem";

function useStake() {
  const { address: account } = useAccount();

  const { writeContract } = useWriteContract();

  return React.useCallback(
    async (amount: string) => {
      const { request } = await publicClient.simulateContract({
        address: getAddress(contractData.contractAddress),
        abi: contractData.contractABI,
        functionName: "stake",
        args: [parseEther(amount)],
        account,
      });

      writeContract(request);
    },
    [account, writeContract],
  );
}

export default useStake;

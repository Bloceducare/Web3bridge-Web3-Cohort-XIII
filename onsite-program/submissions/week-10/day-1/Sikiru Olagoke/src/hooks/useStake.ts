import React from "react";
import { contractData, publicClient, walletClient } from "@/config/config";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";
//import useApproval from "./useApproval";

function useStake() {
  const { address: account } = useAccount();
  // const approval = useApproval();

  const { writeContract } = useWriteContract();

  return React.useCallback(
    async (amount: string) => {
      // approval(amount);
      const { request } = await publicClient.simulateContract({
        address: contractData.contractAddress,
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

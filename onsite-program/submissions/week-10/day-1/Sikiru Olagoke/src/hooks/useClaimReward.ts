import React from "react";
import { contractData, publicClient } from "@/config/config";
import { useAccount, useWriteContract } from "wagmi";

function useClaimReward() {
  const { address: account } = useAccount();

  const { writeContract } = useWriteContract();

  return React.useCallback(async () => {
    const { request } = await publicClient.simulateContract({
      address: contractData.contractAddress,
      abi: contractData.contractABI,
      functionName: "claimRewards",
      account,
    });

    writeContract(request);
  }, [account, writeContract]);
}

export default useClaimReward;

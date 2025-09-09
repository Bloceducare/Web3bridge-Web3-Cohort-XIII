import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { STAKE_CONTRACT_ABI } from "../config/ABI";

const useStakingParams = () => {
  const [params, setParams] = useState({
    totalStaked: null,
    currentRewardRate: null,
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  useEffect(() => {
    async function getParams() {
      try {
        const [totalStaked, currentRewardRate] = await Promise.all([
          publicClient.readContract({
            address: import.meta.env.VITE_STAKING_CONTRACT,
            abi: STAKE_CONTRACT_ABI,
            functionName: "totalStaked",
          }),
          publicClient.readContract({
            address: import.meta.env.VITE_STAKING_CONTRACT,
            abi: STAKE_CONTRACT_ABI,
            functionName: "currentRewardRate",
          }),
        ]);

        setParams({
          totalStaked,
          currentRewardRate,
        });
      } catch (err) {
        console.error("Error fetching staking params:", err);
      }
    }

    getParams();
  }, [publicClient]); 

  return params;
};

export default useStakingParams;

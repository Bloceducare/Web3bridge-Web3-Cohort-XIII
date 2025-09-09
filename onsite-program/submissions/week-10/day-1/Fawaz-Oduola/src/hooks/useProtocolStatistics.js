import React, { useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { STAKING_CONTRACT_ABI } from "../config/ABI";
import { parseAbiItem } from "viem";

function useProtocolStats() {
  const publicClient = usePublicClient();
  const [protocolStats, setProtocolStats] = useState();

 useEffect(() => {
    if (!publicClient) return;

    const fetchStats = async () => {
      const [totalStaked, totalRewards, currentRewardRate, currentAPR, aprReductionPerThousand, minLockDuration] =
        await Promise.all([
          publicClient.readContract({
            address: import.meta.env.VITE_STAKING_CONTRACT,
            abi: STAKING_CONTRACT_ABI,
            functionName: "totalStaked",
          }),
          publicClient.readContract({
            address: import.meta.env.VITE_STAKING_CONTRACT,
            abi: STAKING_CONTRACT_ABI,
            functionName: "getTotalRewards",
          }),
          publicClient.readContract({
            address: import.meta.env.VITE_STAKING_CONTRACT,
            abi: STAKING_CONTRACT_ABI,
            functionName: "currentRewardRate",
          }),
          publicClient.readContract({
            address: import.meta.env.VITE_STAKING_CONTRACT,
            abi: STAKING_CONTRACT_ABI,
            functionName: "initialApr",
          }),
          publicClient.readContract({
            address: import.meta.env.VITE_STAKING_CONTRACT,
            abi: STAKING_CONTRACT_ABI,
            functionName: "aprReductionPerThousand",
          }),
          publicClient.readContract({
            address: import.meta.env.VITE_STAKING_CONTRACT,
            abi: STAKING_CONTRACT_ABI,
            functionName: "minLockDuration",
          }),
        ]);

      setProtocolStats({
        totalStaked,
        totalRewards,
        currentRewardRate,
        currentAPR,
        aprReductionPerThousand,
        minLockDuration,
      });
    };

    fetchStats();

    const unwatch = publicClient.watchEvent({
      address: import.meta.env.VITE_STAKING_CONTRACT,
      events: [
        parseAbiItem(
          "event Staked(address indexed user,uint256 amount,uint256 timestamp,uint256 newTotalStaked,uint256 currentRewardRate)"
        ),
        parseAbiItem(
          "event Withdrawn(address indexed user,uint256 amount,uint256 timestamp,uint256 newTotalStaked,uint256 currentRewardRate,uint256 rewardsAccrued)"
        ),
        parseAbiItem(
          "event EmergencyWithdrawn(address indexed user,uint256 amount,uint256 penalty,uint256 timestamp,uint256 newTotalStaked)"
        ),
        parseAbiItem(
          "event RewardRateUpdated(uint256 oldRate,uint256 newRate,uint256 timestamp,uint256 totalStaked)"
        ),
      ],
      onLogs: async (logs) => {
        console.log("Event log:", logs);
        await fetchStats(); 
      },
    });

    return () => {
      if (unwatch) unwatch();
    };
  }, [publicClient]);

  return useMemo(() => protocolStats, [protocolStats]);
}

export default useProtocolStats;

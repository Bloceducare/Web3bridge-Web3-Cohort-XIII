import React, { useEffect, useMemo, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { STAKING_CONTRACT_ABI } from "../config/ABI";
import { parseAbiItem } from "viem";

function useUserInfo() {
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const [userInfo, setUserInfo] = useState();

  useEffect(() => {
    if (!publicClient) return;
    if (!walletClient.data?.account.address) return;
    const fetchUserInfo = async () => {
      const _userInfo = await publicClient.readContract({
        address: import.meta.env.VITE_STAKING_CONTRACT,
        abi: STAKING_CONTRACT_ABI,
        functionName: "getUserDetails",
        args: [walletClient.data.account.address],
      });

      setUserInfo(_userInfo);
    };

    fetchUserInfo();

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
      onLogs: async () => {
        await fetchUserInfo();
      },
    });

    return () => {
      if (unwatch) unwatch();
    };
  }, [publicClient, walletClient.data?.account.address]);
  return useMemo(() => userInfo, [userInfo]);
}

export default useUserInfo;

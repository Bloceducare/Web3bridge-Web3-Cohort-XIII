import { STACKING_CONTRACT } from "@/common/abi";
import { publicClient } from "@/common/constant";
import { useEffect, useMemo, useState } from "react";
import { Address, parseAbiItem } from "viem";
import { useAccount } from "wagmi";

export function useGetUserStake() {
  const { address } = useAccount();
  const [userStake,  setUserStake] = useState<unknown>();

  useEffect(() => {
    ( async() => {
      const result = await publicClient.readContract({
        abi: STACKING_CONTRACT,
        address: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address,
        args: [address],
        functionName: 'getUserDetails'
      })
      // console.log("res", result);
      setUserStake(result);
    })()
  }, [address])

  useEffect(() => {
    const onProposal = (logs: any) => {
      const event = logs[0];
      const { timestamp, currentRewardRate, newTotalStaked } = event.args;
      const newUserInfo = {
        stakedAmount: newTotalStaked,
        lastStakeTimestamp: timestamp,
        rewardDebt: currentRewardRate,
        pendingRewards: currentRewardRate,
      };
      setUserStake(newUserInfo);
    }
    const unwatch = publicClient.watchEvent({
      address: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address,
      event: parseAbiItem('event Staked(address indexed user,uint256 amount,uint256 timestamp,uint256 newTotalStaked, uint256 currentRewardRate)'),
      onLogs: onProposal
    })

    return () => unwatch();
  }, [publicClient])

  return useMemo(() => userStake, [userStake]);
}

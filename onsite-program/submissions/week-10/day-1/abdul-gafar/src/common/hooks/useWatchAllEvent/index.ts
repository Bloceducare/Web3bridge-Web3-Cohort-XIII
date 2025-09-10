import { STACKING_CONTRACT } from "@/common/abi";
import { publicClient } from "@/common/constant";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Address, isAddress, parseAbi } from "viem";
import { useAccount } from "wagmi";

interface StakedEvent {
  user: Address;
  amount: bigint;
  timestamp: bigint;
  newTotalStaked: bigint;
  currentRewardRate: bigint;
}

export function useWatchAllEvent() {
  const { address } = useAccount();
  const [stakedEvents, setStakedEvents] = useState<any[]>([]);
  const [withdrawnEvents, setWithdrawnEvents] = useState<any[]>([]);
  const [rewardsClaimedEvents, setRewardsClaimedEvents] = useState<any[]>([]);
  const [emergencyWithdrawnEvents, setEmergencyWithdrawnEvents] = useState<any[]>([]);
  const [rewardRateUpdatedEvents, setRewardRateUpdatedEvents] = useState<any[]>([]);
  const stakingContractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address;

  useEffect(() => {
    if (!address || !stakingContractAddress) {
      toast.error('kindly connect your wallet');
      return;
    }
    if (!isAddress(stakingContractAddress)) {
      console.error('Invalid staking contract address');
      return;
    }

    const unwatch = publicClient.watchEvent({
      address: stakingContractAddress,
      events: parseAbi([
        'event Staked(address indexed user,uint256 amount,uint256 timestamp,uint256 newTotalStaked, uint256 currentRewardRate)',
        'event Withdrawn(address indexed user, uint256 amount, uint256 timestamp, uint256 newTotalStaked, uint256 currentRewardRate, uint256 rewardsAccrued)',
        'event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp, uint256 newPendingRewards, uint256 totalStaked)',
        'event EmergencyWithdrawn(address indexed user, uint256 amount, uint256 penalty, uint256 timestamp, uint256 newTotalStaked)',
        'event RewardRateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp, uint256 totalStaked)'
      ]),
      onLogs: logs => {
        console.log("Logs", logs[0])
        const eventName = logs[0].eventName;
        switch (eventName) {
          case "Staked": {
            setStakedEvents((prev) => [logs[0].args, ...prev]);
            break;
          }
          case "Withdrawn": {
            setWithdrawnEvents((prev) => [logs[0].args, ...prev]);
            break;
          }
          case "RewardsClaimed": {
            setRewardsClaimedEvents((prev) => [logs[0].args, ...prev]);
            break;
          }
          case "EmergencyWithdrawn": {
            setEmergencyWithdrawnEvents((prev) => [logs[0].args, ...prev]);
            break;
          }
          case "RewardRateUpdated": {
            setRewardRateUpdatedEvents((prev) => [logs[0].args, ...prev]);
            break;
          }
          default:
            console.warn("Unhandled event:", eventName, logs);
        }
      }
    });

    return () => unwatch();
  }, [])

  return {
    stakedEvents,
    withdrawnEvents,
    rewardsClaimedEvents,
    emergencyWithdrawnEvents,
    rewardRateUpdatedEvents,
  };
}

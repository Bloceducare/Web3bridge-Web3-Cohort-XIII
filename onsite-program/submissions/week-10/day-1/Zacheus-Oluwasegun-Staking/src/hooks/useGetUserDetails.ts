import { useAccount, usePublicClient } from "wagmi";
import { STAKING_CONTRACT_ABI } from "../config/staking_contract_abi";
import { useEffect, useMemo, useState } from "react";

export interface UserDetails {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  pendingRewards: bigint;
  timeUntilUnlock: bigint;
  canWithdraw: boolean;
}

const useGetUserDetails = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [userDetails, setUserDetails] = useState<UserDetails>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserDetails = async () => {
    if (!publicClient || !address) {
      setUserDetails(undefined);
      return;
    }

    setIsLoading(true);

    const userDetailsResult = await publicClient.readContract({
      address: import.meta.env.VITE_STAKING_CONTRACT,
      abi: STAKING_CONTRACT_ABI,
      functionName: "getUserDetails",
      args: [address],
    });

    setUserDetails(userDetailsResult);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserDetails();
  }, [publicClient, address]);

  useEffect(() => {
    if (!publicClient || !address) return;

    const onUserEvent = (logs:any) => {
      const log = logs[0];
      if (log?.args?.user === address) {
        fetchUserDetails();
      }
    };

    const stakedEventAbiItem = STAKING_CONTRACT_ABI.find(
      // @ts-ignore
      (x) => x.name === "Staked" && x.type === "event"
    );

    const withdrawnEventAbiItem = STAKING_CONTRACT_ABI.find(
      // @ts-ignore
      (x) => x.name === "Withdrawn" && x.type === "event"
    );

    const rewardsClaimedEventAbiItem = STAKING_CONTRACT_ABI.find(
      // @ts-ignore
      (x) => x.name === "RewardsClaimed" && x.type === "event"
    );

    const unwatchStaked = publicClient.watchEvent({
      address: import.meta.env.VITE_STAKING_CONTRACT,
      event: stakedEventAbiItem,
      onLogs: onUserEvent,
    });

    const unwatchWithdrawn = publicClient.watchEvent({
      address: import.meta.env.VITE_STAKING_CONTRACT,
      event: withdrawnEventAbiItem,
      onLogs: onUserEvent,
    });

    const unwatchRewardsClaimed = publicClient.watchEvent({
      address: import.meta.env.VITE_STAKING_CONTRACT,
      event: rewardsClaimedEventAbiItem,
      onLogs: onUserEvent,
    });

    return () => {
      unwatchStaked();
      unwatchWithdrawn();
      unwatchRewardsClaimed();
    };
  }, [publicClient, address]);

  return useMemo(() => ({userDetails, isLoading}), [userDetails, isLoading, publicClient]);
};

export default useGetUserDetails;
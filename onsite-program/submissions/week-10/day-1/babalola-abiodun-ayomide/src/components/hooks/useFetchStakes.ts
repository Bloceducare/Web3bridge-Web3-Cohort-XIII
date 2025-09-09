import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from "@/constants";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { usePublicClient, useAccount } from "wagmi";

interface UserInfo {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  pendingRewards: bigint;
  timeUntilUnlock: bigint;
}

export const useFetchStakes = () => {
  const client = usePublicClient();
  const { address } = useAccount();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const fetchUserInfo = useCallback(async () => {
    if (!client || !address) return;
    try {
      const info = await client.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: "userInfo",
        args: [address],
      });

      const parsed: UserInfo = {
        stakedAmount: info[0] as bigint,
        lastStakeTimestamp: info[1] as bigint,
        pendingRewards: info[2] as bigint,
        timeUntilUnlock: info[3] as bigint,
      };

      setUserInfo(parsed);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong fetching staking positions");
    }
  }, [address, client]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    if (!client || !address) return;

    const unwatch = client.watchContractEvent({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      eventName: "Staked",
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { user, amount } = log.args as {
            user: `0x${string}`;
            amount: bigint;
          };

          if (user.toLowerCase() === address.toLowerCase()) {
            toast.success(`You Successfully staked ${amount.toString()} tokens`);
            fetchUserInfo();
          }
        });
      },
    });

    return () => {
      unwatch?.();
    };
  }, [client, address, fetchUserInfo]);

  return { userInfo, refetch: fetchUserInfo };
};

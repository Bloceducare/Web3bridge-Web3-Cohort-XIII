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

  useEffect(() => {
    (async () => {
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
    })();
  }, [publicClient, address]);

  return useMemo(() => ({userDetails, isLoading}), [userDetails, isLoading, publicClient]);
};

export default useGetUserDetails;

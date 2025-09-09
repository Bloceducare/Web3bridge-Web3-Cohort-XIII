import { useState, useCallback, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { STAKING_CONTRACT_ABI } from "../config/ABI";

export default function useStaking() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [totalStaked, setTotalStaked] = useState(0n);
  const [currentApr, setCurrentApr] = useState(0n);
  const [userStakes, setUserStakes] = useState([]);
  const [pendingRewards, setPendingRewards] = useState(0n);
  const [unlockTimes, setUnlockTimes] = useState([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [userStakedAmount, setUserStakedAmount] = useState(0n);
  const [emergencyPenaltyPercent, setEmergencyPenaltyPercent] = useState(0n);

  const contractAddress = import.meta.env.VITE_STAKING_CONTRACT;

  const read = useCallback(
    async (functionName, args = []) => {
      if (!publicClient || !contractAddress) return undefined;
      return publicClient.readContract({
        address: contractAddress,
        abi: STAKING_CONTRACT_ABI,
        functionName,
        args,
      });
    },
    [publicClient, contractAddress]
  );

  const fetchPositions = useCallback(async () => {
    if (!address) return;
    setIsLoadingPositions(true);
    try {
      const [total, apr, userDetails, penalty] = await Promise.all([
        read("totalStaked"),
        read("currentRewardRate"),
        read("getUserDetails", [address]),
        read("emergencyWithdrawPenalty"),
      ]);

      if (typeof total !== "undefined") setTotalStaked(total);
      if (typeof apr !== "undefined") setCurrentApr(apr);

      if (typeof penalty !== "undefined") setEmergencyPenaltyPercent(penalty);

      if (userDetails) {
        const { stakedAmount, lastStakeTimestamp, pendingRewards: pr, timeUntilUnlock } = userDetails;
        setUserStakes([
          {
            amount: stakedAmount,
            timestamp: lastStakeTimestamp,
          },
        ]);
        setUserStakedAmount(stakedAmount ?? 0n);
        setPendingRewards(pr);
        // timeUntilUnlock is usually seconds remaining; compute absolute unlock = now + remaining
        const nowSec = Math.floor(Date.now() / 1000);
        const remainingSec = Number(timeUntilUnlock ?? 0n);
        const absoluteUnlock = nowSec + (remainingSec > 0 ? remainingSec : 0);
        setUnlockTimes([absoluteUnlock]);
      } else {
        setUserStakes([]);
        setUserStakedAmount(0n);
        setPendingRewards(0n);
        setUnlockTimes([]);
      }
    } catch (err) {
      console.error("Failed to fetch staking positions:", err);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [address, read]);

  const fetchRewards = useCallback(async () => {
    if (!address) return;
    setIsLoadingRewards(true);
    try {
      const pr = await read("getPendingRewards", [address]);
      if (typeof pr !== "undefined") setPendingRewards(pr);
    } catch (err) {
      console.error("Failed to fetch rewards:", err);
    } finally {
      setIsLoadingRewards(false);
    }
  }, [address, read]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    totalStaked,
    currentApr,
    userStakes,
    pendingRewards,
    unlockTimes,
    isLoadingPositions,
    isLoadingRewards,
    userStakedAmount,
    emergencyPenaltyPercent,
    refreshPositions: fetchPositions,
    refreshRewards: fetchRewards,
  };
}

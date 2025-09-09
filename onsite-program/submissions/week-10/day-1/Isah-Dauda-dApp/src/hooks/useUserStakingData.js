import { useAccount } from "wagmi";
import { useUserDetails, usePendingRewards } from "./useStakingContract.js";
import {
  useTokenBalance,
  useTokenAllowance,
  useTokenSymbol,
} from "./useTokenContract.js";
import { formatDuration } from "../utils/calculations.js";
import { formatTokenAmount } from "../utils/formatters.js";

/**
 * Hook that aggregates all user staking data
 */
export function useUserStakingData() {
  const { address } = useAccount();

  // Contract data
  const {
    data: userDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useUserDetails(address);

  // Get pending rewards separately for more accurate real-time updates
  const { data: pendingRewards, isLoading: isLoadingRewards } =
    usePendingRewards(address);

  const { data: balance, isLoading: isLoadingBalance } =
    useTokenBalance(address);
  const { data: allowance, isLoading: isLoadingAllowance } =
    useTokenAllowance(address);
  const { data: symbol } = useTokenSymbol();

  const isLoading =
    isLoadingDetails ||
    isLoadingBalance ||
    isLoadingAllowance ||
    isLoadingRewards;

  // Process the data from userInfo: [stakedAmount, lastStakeTimestamp, rewardDebt, _]
  // Note: We use separate getPendingRewards call for real-time rewards
  const stakingData = userDetails
    ? {
        stakedAmount: userDetails[0],
        lastStakeTimestamp: Number(userDetails[1]),
        rewardDebt: userDetails[2],
        pendingRewards: pendingRewards || BigInt(0), // Use separate pending rewards call
      }
    : null;

  // Calculate canWithdraw based on lock duration (3 minutes = 180 seconds)
  const currentTime = Math.floor(Date.now() / 1000);
  const lockDuration = 180; // 3 minutes
  const canWithdraw = stakingData
    ? currentTime >= stakingData.lastStakeTimestamp + lockDuration
    : false;

  const timeUntilUnlockSeconds = stakingData
    ? Math.max(0, stakingData.lastStakeTimestamp + lockDuration - currentTime)
    : 0;

  const formattedData = stakingData
    ? {
        stakedAmount: stakingData.stakedAmount,
        stakedAmountFormatted: formatTokenAmount(stakingData.stakedAmount),
        lastStakeTimestamp: stakingData.lastStakeTimestamp,
        pendingRewards: stakingData.pendingRewards || BigInt(0),
        pendingRewardsFormatted: formatTokenAmount(
          stakingData.pendingRewards || BigInt(0)
        ),
        timeUntilUnlock: timeUntilUnlockSeconds,
        timeUntilUnlockFormatted: formatDuration(timeUntilUnlockSeconds),
        canWithdraw: canWithdraw,
        balance: balance || BigInt(0),
        balanceFormatted: formatTokenAmount(balance || BigInt(0)),
        allowance: allowance || BigInt(0),
        hasAllowance: allowance && allowance > BigInt(0),
        tokenSymbol: symbol || "TOKEN",
      }
    : null;

  return {
    data: formattedData,
    isLoading,
    error: detailsError,
    isConnected: !!address,
  };
}

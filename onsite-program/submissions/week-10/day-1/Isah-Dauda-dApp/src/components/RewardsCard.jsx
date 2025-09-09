import React from "react";
import { useAccount } from "wagmi";
import { useStakingContract } from "../hooks/useStakingContract.js";
import { useUserStakingData } from "../hooks/useUserStakingData.js";
import { useTransactionHistory } from "../hooks/useTransactionHistory.js";
import { formatTokenAmount } from "../utils/formatters.js";
import { Gift } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner.jsx";
import toast from "react-hot-toast";

const RewardsCard = () => {
  const { isConnected } = useAccount();
  const { data: userData, isLoading } = useUserStakingData();
  const { claimRewards, isPending } = useStakingContract();
  const { addToTotalRewards, addTransaction } = useTransactionHistory();

  const handleClaimRewards = async () => {
    try {
      const pendingAmount = userData?.pendingRewards
        ? Number(formatTokenAmount(userData.pendingRewards, false))
        : 0;

      await claimRewards();

      // Add to total rewards for protocol stats
      if (pendingAmount > 0) {
        addToTotalRewards(pendingAmount);
        addTransaction({
          type: "claim",
          amount: userData.pendingRewards,
          hash: null, // Will be filled by event listener if available
        });
      }

      toast.success("Claim rewards transaction submitted");
    } catch (error) {
      console.error("Claim rewards error:", error);
      toast.error("Failed to claim rewards");
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Rewards
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Connect your wallet to view rewards</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Rewards
        </h3>
        <div className="text-center py-8">
          <LoadingSpinner text="Loading rewards..." />
        </div>
      </div>
    );
  }

  const hasRewards =
    userData?.pendingRewards && userData.pendingRewards > BigInt(0);
  const hasStake = userData?.stakedAmount && userData.stakedAmount > BigInt(0);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5" />
        Rewards
      </h3>

      <div className="space-y-4">
        {/* Pending Rewards Display */}
        <div className="text-center py-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {userData?.pendingRewardsFormatted || "0"}
          </div>
          <div className="text-sm text-green-600 font-medium">
            {userData?.tokenSymbol || "TOKEN"} Rewards
          </div>
          {/* Debug information */}
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>
              Raw Rewards: {userData?.pendingRewards?.toString() || "0"}
            </div>
            <div>Last Update: {new Date().toLocaleTimeString()}</div>
            <div>Has Stake: {hasStake ? "Yes" : "No"}</div>
            <div>Staked Amount: {userData?.stakedAmountFormatted || "0"}</div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaimRewards}
          disabled={!hasRewards || isPending}
          className="btn-success w-full flex items-center justify-center gap-2"
        >
          {isPending && <LoadingSpinner size="sm" />}
          {isPending ? "Claiming..." : "Claim Rewards"}
        </button>

        {/* Status Message */}
        <div className="text-center text-sm">
          {!hasStake ? (
            <p className="text-gray-500">Start staking to earn rewards</p>
          ) : !hasRewards ? (
            <p className="text-gray-500">
              No rewards available yet. Keep staking to earn!
            </p>
          ) : (
            <p className="text-gray-600">
              Rewards are calculated and updated every 10 seconds
            </p>
          )}
        </div>

        {/* Rewards Info */}
        {hasStake && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Earning Since:</span>
              <span>
                {userData?.lastStakeTimestamp
                  ? new Date(
                      userData.lastStakeTimestamp * 1000
                    ).toLocaleDateString()
                  : "-"}
              </span>
            </div>
            <p className="text-center mt-2 text-gray-500">
              Rewards compound automatically when you stake or withdraw
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsCard;

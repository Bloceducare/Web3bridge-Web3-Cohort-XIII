import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useStakingContract } from "../hooks/useStakingContract.js";
import { useUserStakingData } from "../hooks/useUserStakingData.js";
import { useTransactionHistory } from "../hooks/useTransactionHistory.js";
import {
  calculateEmergencyAmount,
  formatTokenAmount,
} from "../utils/formatters.js";
import { AlertTriangle, Zap, Unlock } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner.jsx";
import toast from "react-hot-toast";

const EmergencyWithdrawCard = () => {
  const { isConnected } = useAccount();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: userData, isLoading } = useUserStakingData();
  const { emergencyWithdraw, isPending } = useStakingContract();
  const { addTransaction } = useTransactionHistory();

  const handleEmergencyWithdraw = async () => {
    try {
      const stakedAmount = userData?.stakedAmount || BigInt(0);

      await emergencyWithdraw();

      // Add transaction to history
      addTransaction({
        type: "emergency",
        amount: stakedAmount,
        hash: null, // Will be filled by event listener if available
      });

      toast.success("Emergency withdrawal transaction submitted");
      setShowConfirmation(false);
    } catch (error) {
      console.error("Emergency withdrawal error:", error);
      toast.error("Emergency withdrawal failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="card border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Emergency Withdrawal
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">
            Connect your wallet to access emergency withdrawal
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Emergency Withdrawal
        </h3>
        <div className="text-center py-8">
          <LoadingSpinner text="Loading..." />
        </div>
      </div>
    );
  }

  const hasStake = userData?.stakedAmount && userData.stakedAmount > BigInt(0);
  const canWithdraw = userData?.canWithdraw || false;
  const emergencyAmount = hasStake
    ? calculateEmergencyAmount(userData.stakedAmount)
    : BigInt(0);
  const penaltyAmount = hasStake
    ? userData.stakedAmount - emergencyAmount
    : BigInt(0);

  if (!hasStake) {
    return (
      <div className="card border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Emergency Withdrawal
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">
            No staked tokens available for emergency withdrawal
          </p>
        </div>
      </div>
    );
  }

  // If lock period has expired, show different message
  if (canWithdraw) {
    return (
      <div className="card border-green-200 bg-green-50">
        <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
          <Unlock className="w-5 h-5" />
          Emergency Withdrawal
        </h3>
        <div className="text-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-green-100 rounded-full">
              <Unlock className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-green-800 font-semibold mb-2">
                Lock Period Has Expired!
              </p>
              <p className="text-green-700 text-sm">
                You can now withdraw your full staked amount without penalty
                using the regular Withdrawal card above. Emergency withdrawal is
                not needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-red-200 bg-red-50">
      <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Emergency Withdrawal
      </h3>

      <div className="space-y-4">
        {/* Warning */}
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800 mb-1">
                Warning: Heavy Penalty
              </h4>
              <p className="text-sm text-red-700">
                Emergency withdrawal incurs a 50% penalty. Only use this feature
                if you absolutely need immediate access to your funds.
              </p>
            </div>
          </div>
        </div>

        {/* Calculation Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-red-200">
            <span className="text-gray-700">Current Stake:</span>
            <span className="font-semibold">
              {userData.stakedAmountFormatted} {userData.tokenSymbol}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-red-200">
            <span className="text-red-600">Penalty (50%):</span>
            <span className="font-semibold text-red-600">
              -{formatTokenAmount(penaltyAmount)} {userData.tokenSymbol}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 bg-red-100 px-3 rounded">
            <span className="font-semibold text-gray-700">
              You Will Receive:
            </span>
            <span className="font-bold text-green-600">
              {formatTokenAmount(emergencyAmount)} {userData.tokenSymbol}
            </span>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation ? (
          <div className="space-y-3 bg-white p-4 rounded-lg border border-red-300">
            <p className="text-sm font-medium text-red-800">
              Are you absolutely sure you want to proceed with emergency
              withdrawal?
            </p>
            <p className="text-xs text-red-600">
              This action cannot be undone. You will lose 50% of your staked
              tokens.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleEmergencyWithdraw}
                disabled={isPending}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {isPending && <LoadingSpinner size="sm" />}
                <Zap className="w-4 h-4" />
                {isPending ? "Processing..." : "Confirm Emergency Withdrawal"}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isPending}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmation(true)}
            className="btn-danger w-full flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Withdraw (50% Penalty)
          </button>
        )}

        {/* Additional Info */}
        <div className="text-xs text-gray-600 text-center">
          Emergency withdrawal is only recommended in extreme circumstances.
          Consider waiting for the lock period to expire to avoid the penalty.
        </div>
      </div>
    </div>
  );
};

export default EmergencyWithdrawCard;

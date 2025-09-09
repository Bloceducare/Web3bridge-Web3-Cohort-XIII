import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useStakingContract } from "../hooks/useStakingContract.js";
import { useTokenContract } from "../hooks/useTokenContract.js";
import { useUserStakingData } from "../hooks/useUserStakingData.js";
import { useTransactionHistory } from "../hooks/useTransactionHistory.js";
import { parseTokenAmount, isValidNumber } from "../utils/formatters.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import toast from "react-hot-toast";

const StakingCard = () => {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const { data: userData, isLoading: isLoadingUser } = useUserStakingData();
  const { stake, isPending: isStaking } = useStakingContract();
  const { approve, isPending: isApprovePending } = useTokenContract();
  const { addTransaction } = useTransactionHistory();

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxClick = () => {
    if (userData?.balanceFormatted) {
      setAmount(userData.balanceFormatted);
    }
  };

  const handleApprove = async () => {
    if (!amount || !isValidNumber(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsApproving(true);
      const parsedAmount = parseTokenAmount(amount);
      await approve(parsedAmount);
      toast.success("Approval transaction submitted");
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleStake = async () => {
    if (!amount || !isValidNumber(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    const parsedAmount = parseTokenAmount(amount);
    const balance = userData?.balance || BigInt(0);

    if (parsedAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await stake(parsedAmount);

      // Add transaction to history
      addTransaction({
        type: "stake",
        amount: parsedAmount,
        hash: null, // Will be filled by event listener if available
      });

      toast.success("Staking transaction submitted");
      setAmount("");
    } catch (error) {
      console.error("Staking error:", error);
      toast.error("Staking failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Stake Tokens
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Connect your wallet to start staking</p>
        </div>
      </div>
    );
  }

  if (isLoadingUser) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Stake Tokens
        </h3>
        <div className="text-center py-8">
          <LoadingSpinner text="Loading user data..." />
        </div>
      </div>
    );
  }

  const needsApproval =
    !userData?.hasAllowance ||
    (amount &&
      isValidNumber(amount) &&
      parseTokenAmount(amount) > (userData?.allowance || BigInt(0)));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Stake Tokens</h3>

      <div className="space-y-4">
        {/* Balance Display */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Available Balance:</span>
          <span className="font-medium">
            {userData?.balanceFormatted || "0"}{" "}
            {userData?.tokenSymbol || "TOKEN"}
          </span>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Amount to Stake
          </label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.0"
              className="input-field pr-16"
              disabled={isStaking || isApprovePending || isApproving}
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700"
              disabled={isStaking || isApprovePending || isApproving}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={
                !amount ||
                !isValidNumber(amount) ||
                isApprovePending ||
                isApproving
              }
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {(isApprovePending || isApproving) && (
                <LoadingSpinner size="sm" />
              )}
              {isApprovePending || isApproving
                ? "Approving..."
                : "Approve Tokens"}
            </button>
          ) : (
            <button
              onClick={handleStake}
              disabled={!amount || !isValidNumber(amount) || isStaking}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isStaking && <LoadingSpinner size="sm" />}
              {isStaking ? "Staking..." : "Stake Tokens"}
            </button>
          )}
        </div>

        {/* Helper Text */}
        {needsApproval && (
          <p className="text-xs text-gray-500">
            You need to approve tokens before staking. This is a one-time
            transaction.
          </p>
        )}
      </div>
    </div>
  );
};

export default StakingCard;

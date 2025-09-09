import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useStakingContract } from "../hooks/useStakingContract.js";
import { useUserStakingData } from "../hooks/useUserStakingData.js";
import { useTransactionHistory } from "../hooks/useTransactionHistory.js";
import { parseTokenAmount, isValidNumber } from "../utils/formatters.js";
import { ArrowDownLeft } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner.jsx";
import toast from "react-hot-toast";

const WithdrawalCard = () => {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");

  const { data: userData, isLoading } = useUserStakingData();
  const { withdraw, isPending } = useStakingContract();
  const { addTransaction } = useTransactionHistory();

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxClick = () => {
    if (userData?.stakedAmountFormatted) {
      setAmount(userData.stakedAmountFormatted);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !isValidNumber(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!userData?.canWithdraw) {
      toast.error(
        "Tokens are still locked. Please wait until the lock period expires."
      );
      return;
    }

    const parsedAmount = parseTokenAmount(amount);
    const stakedAmount = userData?.stakedAmount || BigInt(0);

    if (parsedAmount > stakedAmount) {
      toast.error("Amount exceeds staked balance");
      return;
    }

    try {
      await withdraw(parsedAmount);

      // Add transaction to history
      addTransaction({
        type: "withdraw",
        amount: parsedAmount,
        hash: null, // Will be filled by event listener if available
      });

      toast.success("Withdrawal transaction submitted");
      setAmount("");
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Withdrawal failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5" />
          Withdraw Tokens
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Connect your wallet to withdraw</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5" />
          Withdraw Tokens
        </h3>
        <div className="text-center py-8">
          <LoadingSpinner text="Loading..." />
        </div>
      </div>
    );
  }

  const hasStake = userData?.stakedAmount && userData.stakedAmount > BigInt(0);
  const canWithdraw = userData?.canWithdraw;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ArrowDownLeft className="w-5 h-5" />
        Withdraw Tokens
      </h3>

      {!hasStake ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tokens staked</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Available to Withdraw */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Available to Withdraw:</span>
            <span className="font-medium">
              {canWithdraw ? userData.stakedAmountFormatted : "0"}{" "}
              {userData.tokenSymbol}
            </span>
          </div>

          {/* Lock Warning */}
          {!canWithdraw && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="text-amber-800 text-sm">
                <p className="font-medium">Tokens are locked</p>
                <p className="mt-1">
                  Unlock time: {userData.timeUntilUnlockFormatted}
                </p>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount to Withdraw
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                className="input-field pr-16"
                disabled={!canWithdraw || isPending}
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700"
                disabled={!canWithdraw || isPending}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Withdraw Button */}
          <button
            onClick={handleWithdraw}
            disabled={
              !canWithdraw || !amount || !isValidNumber(amount) || isPending
            }
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
              canWithdraw
                ? "bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isPending && <LoadingSpinner size="sm" />}
            {isPending
              ? "Withdrawing..."
              : canWithdraw
              ? "Withdraw Tokens"
              : "Tokens Locked"}
          </button>

          {/* Helper Text */}
          <p className="text-xs text-gray-500">
            {canWithdraw
              ? "Withdraw your staked tokens. Rewards will be automatically claimed."
              : "Tokens must be staked for at least 3 minutes before withdrawal."}
          </p>
        </div>
      )}
    </div>
  );
};

export default WithdrawalCard;

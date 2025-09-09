"use client";

import { useState, useEffect } from "react";
import { useStakingContract } from "../hooks/useStaking";
import { useTokenApproval } from "../hooks/useApproval";
import { STAKING_CONTRACT_ADDRESS } from "../config/contract";

export function StakeForm() {
  const [amount, setAmount] = useState("");

  const {
    stake,
    isPending: isStaking,
    isConfirming: isStakingConfirming,
  } = useStakingContract();

  const {
    approve,
    isPending: isApproving,
    isConfirming: isApprovalConfirming,
    isConfirmed: isApprovalConfirmed,
  } = useTokenApproval();

  // 🔄 Once approval is confirmed, trigger stake
  useEffect(() => {
    if (isApprovalConfirmed && amount) {
      stake(amount);
      setAmount(""); // reset after staking
    }
  }, [isApprovalConfirmed, amount, stake]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    approve(STAKING_CONTRACT_ADDRESS, amount);
  };

  const isBusy =
    isApproving || isApprovalConfirming || isStaking || isStakingConfirming;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Stake Tokens</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="stake-amount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Amount to Stake (TOKEN)
          </label>
          <input
            id="stake-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0.0"
            disabled={isBusy}
          />
        </div>
        <button
          type="submit"
          disabled={isBusy || !amount}
          className="w-full bg-gray-600 text-white py-2 px-4 cursor-pointer rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApproving
            ? "Approving..."
            : isApprovalConfirming
            ? "Waiting for Approval..."
            : isStaking
            ? "Staking..."
            : isStakingConfirming
            ? "Confirm Staking..."
            : "Approve & Stake"}
        </button>
      </form>
    </div>
  );
}

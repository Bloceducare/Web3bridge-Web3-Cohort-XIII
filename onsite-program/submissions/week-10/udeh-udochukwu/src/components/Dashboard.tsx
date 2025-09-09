"use client";

import useStake from "@/hooks/useStake";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function Dashboard() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const { address } = useAccount();

  // Use your stake hook
  const stakeTokens = useStake();

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsStaking(true);
    try {
      await stakeTokens(parseFloat(stakeAmount));
      setStakeAmount(""); // Clear input on success
    } catch (error) {
      console.error("Staking failed:", error);
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staking Dashboard</h1>

        <Link
          href="/positions"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          View Positions
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Current APR</p>
          <p className="text-xl font-semibold">12.00%</p>
        </div>
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Total Staked</p>
          <p className="text-xl font-semibold">1,234,567</p>
        </div>
        <div className="p-4 border border-gray-300 rounded">
          <p className="text-sm text-gray-600">Reward Rate</p>
          <p className="text-xl font-semibold">0.032%/day</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="p-6 border border-gray-300 rounded">
          <h2 className="text-lg font-semibold mb-4">Stake Tokens</h2>
          <div className="space-y-4">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isStaking}
            />
            <button
              onClick={handleStake}
              disabled={!address || isStaking || !stakeAmount}
              className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isStaking ? "Staking..." : "Stake"}
            </button>
          </div>
        </div>

        <div className="p-6 border border-gray-300 rounded">
          <h2 className="text-lg font-semibold mb-4">Your Position</h2>
          <div className="space-y-3">
            <p>
              Staked: <span className="font-semibold">10,000 TOKENS</span>
            </p>
            <p>
              Pending Rewards:{" "}
              <span className="font-semibold text-green-600">
                234.56 TOKENS
              </span>
            </p>
            <p>
              Unlock in: <span className="font-semibold">5 days 12 hours</span>
            </p>
            <div className="space-y-2 pt-2">
              <button
                disabled={!address}
                className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Claim Rewards
              </button>
              <button
                disabled={!address}
                className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Emergency Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

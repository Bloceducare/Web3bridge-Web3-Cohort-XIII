"use client";

import {
  useTotalStaked,
  useCurrentRewardRate,
  useInitialApr,
} from "../hooks/useStaking";
import { formatEther } from "viem";

export function ProtocolStats() {
  const { data: totalStaked } = useTotalStaked();
  const { data: currentRewardRate } = useCurrentRewardRate();
  const { data: initialApr } = useInitialApr();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Protocol Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-purple-600 font-medium">Total Staked</p>
          <p className="text-2xl font-bold text-purple-800">
            {totalStaked ? formatEther(totalStaked) : "0.00"} STK
          </p>
        </div>
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <p className="text-indigo-600 font-medium">Current APR</p>
          <p className="text-2xl font-bold text-indigo-800">
            {initialApr ? `${Number(initialApr) / 100}%` : "0%"}
          </p>
        </div>
        <div className="text-center p-4 bg-teal-50 rounded-lg">
          <p className="text-teal-600 font-medium">Reward Rate</p>
          <p className="text-2xl font-bold text-teal-800">
            {currentRewardRate ? formatEther(currentRewardRate) : "0.00"}{" "}
            STK/block
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAccount } from "wagmi";
import {
  useUserDetails,
  usePendingRewards,
  useTimeUntilUnlock,
} from "../hooks/useStaking";
import { formatEther } from "viem";
import { useUserHistory } from "../hooks/useUserHistory";
import { use } from "react";

export function UserStats() {
  const { address } = useAccount();
  const { data: userDetails } = useUserDetails(address);
  const { data: pendingRewards } = usePendingRewards(address);
  const { data: timeUntilUnlock } = useTimeUntilUnlock(address);
  const history = useUserHistory()

  const formatTime = (seconds: bigint) => {
    const secondsNum = Number(seconds);
    if (secondsNum <= 0) return "Unlocked";

    const days = Math.floor(secondsNum / (24 * 3600));
    const hours = Math.floor((secondsNum % (24 * 3600)) / 3600);
    const minutes = Math.floor((secondsNum % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  if (!address) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-900">
          Your Staking Position
        </h2>
        <p className="text-gray-500">
          Connect your wallet to view your staking position
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-900  ">
        Your Staking Position
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-600 font-medium">Staked Amount</p>
          <p className="text-2xl font-bold text-blue-800">
            {userDetails ? formatEther(userDetails.stakedAmount) : "0.00"} STK
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-green-600 font-medium">Pending Rewards</p>
          <p className="text-2xl font-bold text-green-800">
            {pendingRewards ? formatEther(pendingRewards) : "0.00"} STK
          </p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-orange-600 font-medium">Time Until Unlock</p>
          <p className="text-lg font-bold text-orange-800">
            {timeUntilUnlock ? formatTime(timeUntilUnlock) : "N/A"}
          </p>
        </div>
      </div>
       <h3 className="text-xl font-semibold text-gray-800 mb-4">Your History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-50 rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-left text-gray-700 text-sm">
              <th className="p-2">Type</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Date</th>
              <th className="p-2">Tx</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((item, i) => (
                <tr key={i} className="border-t text-sm">
                  <td className="p-2 capitalize">{item.type}</td>
                  <td className="p-2">{item.amount} STK</td>
                  <td className="p-2">
                    {new Date(item.timestamp * 1000).toLocaleString()}
                  </td>
                  <td className="p-2">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

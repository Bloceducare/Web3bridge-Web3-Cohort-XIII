"use client";

import { useGetHooks } from "@/hooks/useGetHooks";
import useWithdraw from "@/hooks/useWithdraw";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";


export default function Positions() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const withdrawTokens = useWithdraw();
  const { address } = useAccount(); // Fix: destructure address properly
const hooksData = useGetHooks();
const userDetails = hooksData?.userDetails;
const minLockDuration = hooksData?.minLockDuration;


  const handleWithdraw = async () => { // Fix: remove parameter, get from state
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsWithdrawing(true);
    try {
      await withdrawTokens(parseFloat(withdrawAmount)); // Fix: pass the amount from state
      setWithdrawAmount(""); // Clear input on success
    } catch (error) {
      console.error("Withdrawal failed:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stake Positions</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Stakes</h2>
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left border-b">Amount</th>
              <th className="p-3 text-left border-b">Rewards</th>
              <th className="p-3 text-left border-b">Status</th>
              <th className="p-3 text-left border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-b">10,000 TOKENS</td>
              <td className="p-3 border-b">234.56 TOKENS</td>
              <td className="p-3 border-b">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  Locked
                </span>
              </td>
              <td className="p-3 border-b">
                <button
                  disabled
                  className="px-3 py-1 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                >
                  5d 12h left
                </button>
              </td>
            </tr>
            <tr>
              <td className="p-3 border-b">5,000 TOKENS</td>
              <td className="p-3 border-b">145.23 TOKENS</td>
              <td className="p-3 border-b">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  Unlocked
                </span>
              </td>
              <td className="p-3 border-b">
                <div className="space-y-2">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Amount to withdraw"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isWithdrawing}
                    max="5000" // Max available amount
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={!address || isWithdrawing || !withdrawAmount}
                    className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">All Stakes</h2>
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left border-b">User</th>
              <th className="p-3 text-left border-b">Amount</th>
              <th className="p-3 text-left border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-b">0x1234...5678</td>
              <td className="p-3 border-b">50,000 TOKENS</td>
              <td className="p-3 border-b">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  Active
                </span>
              </td>
            </tr>
            <tr>
              <td className="p-3 border-b">0xabcd...efgh</td>
              <td className="p-3 border-b">25,000 TOKENS</td>
              <td className="p-3 border-b">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  Locked
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
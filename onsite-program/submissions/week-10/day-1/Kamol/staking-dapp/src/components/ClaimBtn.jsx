import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractConfig } from "../lib/contract";
import React, { useState } from "react";

export default function ClaimBtn({ maxRewards }) {
  const { writeContract, data: tx } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: tx });

  const [amount, setAmount] = useState("");

  const handleClaim = (claimAmount) => {
    writeContract({
      ...contractConfig,
      functionName: "claimRewards",
      args: [claimAmount],
    });
  };

  return (
    <div className="flex flex-col gap-3 mt-4 p-4 border rounded-lg bg-purple-50">
      <label className="text-sm font-semibold text-purple-700">
        Claim Rewards
      </label>

      <input
        type="number"
        placeholder="Enter amount to claim"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border border-purple-300 p-2 rounded w-full"
      />

      <div className="flex gap-2">
        <button
          onClick={() => handleClaim(amount)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full"
          disabled={isLoading || !amount}
        >
          {isLoading ? "Claiming..." : `Claim ${amount}`}
        </button>

        <button
          onClick={() => handleClaim(maxRewards)}
          className="bg-gray-200 hover:bg-gray-300 text-purple-700 px-4 py-2 rounded w-full"
          disabled={isLoading}
        >
          Claim All
        </button>
      </div>

      {isSuccess && (
        <p className="text-green-600 text-sm mt-2">✅ Rewards claimed!</p>
      )}
    </div>
  );
}

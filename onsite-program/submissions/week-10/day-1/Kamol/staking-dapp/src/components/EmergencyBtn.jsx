import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractConfig } from "../lib/contract";
import React from "react";

export default function EmergencyBtn() {
  const { writeContract, data: tx } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: tx });

  const handleEmergencyAll = () => {
    writeContract({
      ...contractConfig,
      functionName: "emergencyWithdraw", // always full withdrawal
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <button
        onClick={handleEmergencyAll}
        className="bg-orange-600 text-white px-4 py-2 rounded"
        disabled={isLoading}
      >
        {isLoading ? "Emergency..." : "Emergency Withdraw All"}
      </button>
      {isSuccess && <span className="text-green-500">✅ Success!</span>}
      <p className="text-sm text-gray-500">
        ⚠ This withdraws your full stake with penalty.
      </p>
    </div>
  );
}

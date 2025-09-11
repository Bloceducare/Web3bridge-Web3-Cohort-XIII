import React from "react";
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractConfig } from "../lib/contract";

export default function WithdrawBtn() {
  const [amount, setAmount] = useState("");
  const { writeContract, data: tx } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: tx });

  const handleWithdraw = () => {
    if (!amount || isNaN(amount)) {
      alert("Enter a valid amount");
      return;
    }

    writeContract({
      ...contractConfig,
      functionName: "withdraw",
      args: [BigInt(amount)],
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <input
        type="number"
        placeholder="Enter amount to withdraw"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <button
        onClick={handleWithdraw}
        className="bg-red-500 text-white px-4 py-2 rounded"
        disabled={isLoading}
      >
        {isLoading ? "Withdrawing..." : "Withdraw"}
      </button>
      {isSuccess && <span className="text-green-500">✅ Success!</span>}
    </div>
  );
}

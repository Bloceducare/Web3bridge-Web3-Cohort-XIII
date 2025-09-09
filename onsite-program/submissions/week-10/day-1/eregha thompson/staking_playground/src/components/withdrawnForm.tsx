"use client";

import { useState } from "react";
import { useStakingContract } from "../hooks/useStaking";

export function WithdrawForm() {
  const [amount, setAmount] = useState("");
  const { withdraw, isPending } = useStakingContract();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount) {
      withdraw(amount);
      setAmount("");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Withdraw</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="withdraw-amount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Amount to Withdraw (STK)
          </label>
          <input
            id="withdraw-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0.0"
            disabled={isPending}
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !amount}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none cursor-pointer focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Withdrawing..." : "Withdraw Tokens"}
        </button>
      </form>
    </div>
  );
}

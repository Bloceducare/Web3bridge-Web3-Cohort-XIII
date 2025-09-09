import { useState, useEffect } from "react";
import { useTransactionHistory } from "./useTransactionHistory.js";

const TOTAL_REWARDS_KEY = "protocol_total_rewards";

export function useTotalRewardsClaimed() {
  const [totalClaimed, setTotalClaimed] = useState(BigInt(0));
  const { rewardHistory } = useTransactionHistory();

  // Load total from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOTAL_REWARDS_KEY);
    if (stored) {
      try {
        setTotalClaimed(BigInt(stored));
      } catch (error) {
        console.error("Error loading total rewards:", error);
        setTotalClaimed(BigInt(0));
      }
    }
  }, []);

  // Update total when reward history changes
  useEffect(() => {
    const totalFromHistory = rewardHistory.reduce((sum, tx) => {
      return sum + BigInt(tx.amount || 0);
    }, BigInt(0));

    if (totalFromHistory > totalClaimed) {
      setTotalClaimed(totalFromHistory);
      localStorage.setItem(TOTAL_REWARDS_KEY, totalFromHistory.toString());
    }
  }, [rewardHistory, totalClaimed]);

  const addRewardsClaimed = (amount) => {
    const newTotal = totalClaimed + BigInt(amount);
    setTotalClaimed(newTotal);
    localStorage.setItem(TOTAL_REWARDS_KEY, newTotal.toString());
  };

  return {
    totalClaimed,
    addRewardsClaimed,
  };
}

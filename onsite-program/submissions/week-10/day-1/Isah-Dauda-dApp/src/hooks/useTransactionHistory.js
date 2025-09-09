import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

const STORAGE_KEY = "staking_transaction_history";
const REWARDS_KEY = "total_rewards_claimed";

export function useTransactionHistory() {
  const { address } = useAccount();
  const [history, setHistory] = useState([]);
  const [totalRewardsClaimed, setTotalRewardsClaimed] = useState(0);

  // Load history from localStorage on mount
  useEffect(() => {
    if (!address) return;

    const stored = localStorage.getItem(`${STORAGE_KEY}_${address}`);
    const storedRewards = localStorage.getItem(`${REWARDS_KEY}_${address}`);

    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading transaction history:", error);
        setHistory([]);
      }
    }

    if (storedRewards) {
      try {
        setTotalRewardsClaimed(parseFloat(storedRewards));
      } catch (error) {
        console.error("Error loading rewards total:", error);
        setTotalRewardsClaimed(0);
      }
    }
  }, [address]);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (!address || history.length === 0) return;

    try {
      localStorage.setItem(
        `${STORAGE_KEY}_${address}`,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error("Error saving transaction history:", error);
    }
  }, [address, history]);

  const addTransaction = (transaction) => {
    const newTransaction = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      address: address,
      ...transaction,
    };

    setHistory((prev) => [newTransaction, ...prev].slice(0, 100)); // Keep last 100 transactions
  };

  const addToTotalRewards = (amount) => {
    if (!address) return;

    const newTotal = totalRewardsClaimed + amount;
    setTotalRewardsClaimed(newTotal);
    localStorage.setItem(`${REWARDS_KEY}_${address}`, newTotal.toString());
  };

  const getTransactionsByType = (type) => {
    return history.filter((tx) => tx.type === type);
  };

  const clearHistory = () => {
    setHistory([]);
    setTotalRewardsClaimed(0);
    if (address) {
      localStorage.removeItem(`${STORAGE_KEY}_${address}`);
      localStorage.removeItem(`${REWARDS_KEY}_${address}`);
    }
  };

  return {
    history,
    totalRewardsClaimed,
    addTransaction,
    addToTotalRewards,
    getTransactionsByType,
    clearHistory,
    // Filtered arrays for easy access
    stakingHistory: history.filter((tx) => tx.type === "stake"),
    withdrawHistory: history.filter((tx) => tx.type === "withdraw"),
    rewardHistory: history.filter((tx) => tx.type === "claim"),
    emergencyHistory: history.filter((tx) => tx.type === "emergency"),
  };
}

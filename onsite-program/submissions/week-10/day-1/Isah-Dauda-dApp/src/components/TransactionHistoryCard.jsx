import React, { useState } from "react";
import { useTransactionHistory } from "../hooks/useTransactionHistory.js";
import { formatTokenAmount, formatTimestamp } from "../utils/formatters.js";
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  AlertTriangle,
} from "lucide-react";

const TransactionHistoryCard = () => {
  const {
    history,
    stakingHistory,
    withdrawHistory,
    rewardHistory,
    emergencyHistory,
  } = useTransactionHistory();
  const [selectedType, setSelectedType] = useState("all");

  const getFilteredHistory = () => {
    switch (selectedType) {
      case "stake":
        return stakingHistory;
      case "withdraw":
        return withdrawHistory;
      case "claim":
        return rewardHistory;
      case "emergency":
        return emergencyHistory;
      default:
        return history;
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "stake":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case "withdraw":
        return <ArrowDownLeft className="w-4 h-4 text-blue-600" />;
      case "claim":
        return <Gift className="w-4 h-4 text-purple-600" />;
      case "emergency":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "stake":
        return "text-green-600 bg-green-50 border-green-200";
      case "withdraw":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "claim":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "emergency":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <History className="w-5 h-5" />
        Transaction History
      </h3>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "all", label: "All", count: history.length },
          { key: "stake", label: "Stakes", count: stakingHistory.length },
          {
            key: "withdraw",
            label: "Withdrawals",
            count: withdrawHistory.length,
          },
          { key: "claim", label: "Claims", count: rewardHistory.length },
          {
            key: "emergency",
            label: "Emergency",
            count: emergencyHistory.length,
          },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setSelectedType(filter.key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === filter.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          filteredHistory.map((tx) => (
            <div
              key={tx.id}
              className={`p-3 rounded-lg border ${getTransactionColor(
                tx.type
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="text-sm opacity-75">
                      {formatTimestamp(tx.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatTokenAmount(tx.amount)} {tx.tokenSymbol || "TOKENS"}
                  </p>
                  {tx.hash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs opacity-75 hover:opacity-100"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              </div>
              {tx.penalty && (
                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <p className="text-sm">
                    Emergency penalty: {formatTokenAmount(tx.penalty)} TOKENS
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionHistoryCard;

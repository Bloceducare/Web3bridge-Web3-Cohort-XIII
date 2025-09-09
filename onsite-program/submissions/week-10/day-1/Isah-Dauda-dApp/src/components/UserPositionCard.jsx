import React from "react";
import { useAccount } from "wagmi";
import { useUserStakingData } from "../hooks/useUserStakingData.js";
import { useTransactionHistory } from "../hooks/useTransactionHistory.js";
import { formatTokenAmount } from "../utils/formatters.js";
import { Clock, Lock, Unlock, ExternalLink } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner.jsx";

const UserPositionCard = () => {
  const { isConnected } = useAccount();
  const { data: userData, isLoading } = useUserStakingData();
  const { history } = useTransactionHistory();

  if (!isConnected) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Position
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">
            Connect your wallet to view your position
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Position
        </h3>
        <div className="text-center py-8">
          <LoadingSpinner text="Loading position..." />
        </div>
      </div>
    );
  }

  const hasStake = userData?.stakedAmount && userData.stakedAmount > BigInt(0);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Position
      </h3>

      {!hasStake ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Lock className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500">No active staking position</p>
          <p className="text-sm text-gray-400 mt-1">
            Stake tokens to start earning rewards
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Staked Amount */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Staked Amount</span>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {userData.stakedAmountFormatted} {userData.tokenSymbol}
              </div>
            </div>
          </div>

          {/* Pending Rewards */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Pending Rewards</span>
            <div className="text-right">
              <div className="font-semibold text-green-600">
                {userData.pendingRewardsFormatted} {userData.tokenSymbol}
              </div>
            </div>
          </div>

          {/* Lock Status */}
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lock Status
            </span>
            <div className="text-right">
              {userData.canWithdraw ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Unlock className="w-4 h-4" />
                  <span className="font-medium">Unlocked</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600">
                  <Lock className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Locked</div>
                    <div className="text-xs">
                      {userData.timeUntilUnlockFormatted}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Recent Transactions
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.slice(0, 10).map((tx) => {
              const getTransactionTypeLabel = (type) => {
                switch (type) {
                  case "stake":
                    return "Staked";
                  case "withdraw":
                    return "Withdrawn";
                  case "claim":
                    return "Claimed";
                  case "emergency":
                    return "Emergency Withdrawn";
                  default:
                    return "Unknown";
                }
              };

              const getTransactionTypeColor = (type) => {
                switch (type) {
                  case "stake":
                    return "text-green-600";
                  case "withdraw":
                    return "text-blue-600";
                  case "claim":
                    return "text-purple-600";
                  case "emergency":
                    return "text-red-600";
                  default:
                    return "text-gray-600";
                }
              };

              return (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md"
                >
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${getTransactionTypeColor(
                        tx.type
                      )}`}
                    >
                      {getTransactionTypeLabel(tx.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatTokenAmount(tx.amount)}
                    </div>
                    {tx.hash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPositionCard;

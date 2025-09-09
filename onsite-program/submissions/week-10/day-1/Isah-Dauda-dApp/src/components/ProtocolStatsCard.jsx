import React from "react";
import { useAccount } from "wagmi";
import { useProtocolStats } from "../hooks/useProtocolStats.js";
import { useTransactionHistory } from "../hooks/useTransactionHistory.js";
import {
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  Clock,
  Database,
} from "lucide-react";
import { formatTokenAmount, formatNumber } from "../utils/formatters.js";
import LoadingSpinner from "./LoadingSpinner.jsx";

const ProtocolStatsCard = () => {
  const { isConnected } = useAccount();
  const { data: stats, isLoading } = useProtocolStats();
  const { totalRewardsClaimed } = useTransactionHistory();

  if (!isConnected) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Protocol Statistics
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">
            Connect your wallet to view protocol statistics
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Protocol Statistics
        </h3>
        <div className="text-center py-8">
          <LoadingSpinner text="Loading stats..." />
        </div>
      </div>
    );
  }

  // Calculate total rewards including claimed rewards
  const totalRewardsNumber = stats?.totalRewards
    ? Number(formatTokenAmount(stats.totalRewards, 18, 4))
    : 0;

  const totalRewardsWithClaimed = totalRewardsNumber + totalRewardsClaimed;

  // Format numbers for better display
  const totalStakedNumber = stats?.totalStaked
    ? Number(formatTokenAmount(stats.totalStaked, 18, 2))
    : 0;

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Protocol Statistics
        </h3>
        <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-amber-500 rounded-full"></div>
      </div>

      {/* Main Statistics Grid - Enhanced for iPad/Laptop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Total Staked */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-200 rounded-xl shadow-sm">
              <DollarSign className="w-6 h-6 text-gray-700" />
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              TVL
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl xl:text-3xl font-bold text-gray-900 break-all">
              {formatNumber(totalStakedNumber)}
            </div>
            <div className="text-sm font-medium text-gray-600">
              Total Value Locked
            </div>
            <div className="text-xs text-gray-500">
              {stats?.totalStakedFormatted || "0"} tokens staked
            </div>
          </div>
        </div>

        {/* Current APR */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-200 rounded-xl shadow-sm">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">
              APR
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl xl:text-3xl font-bold text-green-700 break-all">
              {stats?.currentAPRFormatted || "0%"}
            </div>
            <div className="text-sm font-medium text-green-600">
              Current Annual Rate
            </div>
            <div className="text-xs text-gray-500">
              Updates dynamically based on TVL
            </div>
          </div>
        </div>

        {/* Total Rewards */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 hover:shadow-lg transition-all duration-200 hover:scale-105 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-200 rounded-xl shadow-sm">
              <Users className="w-6 h-6 text-amber-700" />
            </div>
            <div className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              REWARDS
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl xl:text-3xl font-bold text-amber-700 break-all">
              {formatNumber(totalRewardsWithClaimed)}
            </div>
            <div className="text-sm font-medium text-amber-600">
              Total Rewards (incl. claimed)
            </div>
            <div className="text-xs text-gray-500">
              {totalRewardsClaimed.toFixed(4)} claimed by you
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Configuration - Enhanced for larger screens */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-gray-600" />
          <h4 className="text-lg font-semibold text-gray-900">
            Protocol Configuration
          </h4>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Network
              </div>
              <div className="text-lg font-bold text-gray-900">Sepolia</div>
              <div className="text-xs text-gray-500">Testnet</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Lock Period
              </div>
              <div className="text-lg font-bold text-gray-900">3</div>
              <div className="text-xs text-gray-500">minutes</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Emergency Penalty
              </div>
              <div className="text-lg font-bold text-red-600">50%</div>
              <div className="text-xs text-gray-500">of staked amount</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Auto-refresh
              </div>
              <div className="text-lg font-bold text-green-600">10s</div>
              <div className="text-xs text-gray-500">interval</div>
            </div>
          </div>
        </div>
      </div>

      {/* APR Information - Enhanced layout */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h4 className="text-lg font-semibold text-gray-900">
            APR Calculation Details
          </h4>
        </div>

        {/* Better grid layout for larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Base APR
              </span>
              <span className="font-bold text-gray-900">250%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Current APR
              </span>
              <span className="font-bold text-green-600">
                {stats?.currentAPRFormatted || "0%"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Reduction Rate
              </span>
              <span className="font-bold text-gray-900">0.5% per 1k</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Minimum APR
              </span>
              <span className="font-bold text-gray-900">10%</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Total Staked
              </span>
              <span className="font-bold text-gray-900">
                {formatNumber(totalStakedNumber)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Reward Interval
              </span>
              <span className="font-bold text-gray-900">10 seconds</span>
            </div>
          </div>

          <div className="space-y-3 md:col-span-2 xl:col-span-1">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Next APR Update</div>
              <div className="text-sm font-medium text-gray-700">
                When TVL reaches{" "}
                {formatNumber(
                  (Math.floor(totalStakedNumber / 1000) + 1) * 1000
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolStatsCard;

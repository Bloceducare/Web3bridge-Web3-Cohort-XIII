'use client';

import { useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { STAKING_ABI } from '@/config/abi';
import { formatEther, WalletClient } from 'viem';
import { useState, useEffect } from 'react';

interface UserDetails {
  stakedAmount: string;
  lastStakeTimestamp: number;
  pendingRewards: string;
  timeUntilUnlock: number;
  canWithdraw: boolean;
}

interface ContractUserDetails {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  pendingRewards: bigint;
  timeUntilUnlock: bigint;
  canWithdraw: boolean;
}

interface StakePositionsProps {
  account: string;
  walletClient: WalletClient;
}

export default function StakePositions({ account, walletClient }: StakePositionsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'getUserDetails',
        args: [account as `0x${string}`],
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'getPendingRewards',
        args: [account as `0x${string}`],
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'totalStaked',
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'currentRewardRate',
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'initialApr',
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'minLockDuration',
      },
    ],
  });

  if (isLoading || !isClient) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Protocol Statistics</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading staking data...</p>
        </div>
      </div>
    );
  }

  const userDetailsResult = data?.[0]?.result as ContractUserDetails;
  const pendingRewards = data?.[1]?.result as bigint;
  const totalStaked = data?.[2]?.result as bigint;
  const rewardRate = data?.[3]?.result as bigint;
  const apr = data?.[4]?.result as bigint;
  const minLockDuration = data?.[5]?.result as bigint;

  // Debug logging for APR value
  console.log('Current APR value from contract:', apr?.toString());
  console.log('Current APR percentage:', apr ? `${Number(apr) / 100}%` : '0%');

  const formattedUserDetails: UserDetails = userDetailsResult ? {
    stakedAmount: formatEther(userDetailsResult.stakedAmount || 0n),
    lastStakeTimestamp: Number(userDetailsResult.lastStakeTimestamp || 0n),
    pendingRewards: formatEther(userDetailsResult.pendingRewards || 0n),
    timeUntilUnlock: Number(userDetailsResult.timeUntilUnlock || 0n),
    canWithdraw: userDetailsResult.canWithdraw || false,
  } : {
    stakedAmount: '0',
    lastStakeTimestamp: 0,
    pendingRewards: '0',
    timeUntilUnlock: 0,
    canWithdraw: false,
  };

  return (
    <div className="space-y-6">
      {/* Protocol Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Protocol Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Your Pending Rewards</p>
            <p className="text-lg font-bold text-blue-600">
              {pendingRewards ? formatEther(pendingRewards) : '0'} tokens
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Protocol Staked</p>
            <p className="text-lg font-bold text-green-600">
              {totalStaked ? formatEther(totalStaked) : '0'} tokens
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Current Reward Rate</p>
            <p className="text-lg font-bold text-purple-600">
              {rewardRate ? formatEther(rewardRate) : '0'} tokens/min
            </p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">APR</p>
            <p className="text-lg font-bold text-orange-600">
              {apr ? `${Number(apr) / 100}%` : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* Your Stake Position */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Your Stake Position</h2>
        {parseFloat(formattedUserDetails.stakedAmount) === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <p className="text-gray-600">No stake found. Start staking to see your position here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">Your Stake</h3>
                  <p className="text-sm text-gray-600">Active Position</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  !formattedUserDetails.canWithdraw ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {!formattedUserDetails.canWithdraw ? `Locked (${Math.ceil(formattedUserDetails.timeUntilUnlock / (24 * 60 * 60))} days left)` : 'Unlocked'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Amount Staked</p>
                  <p className="font-semibold text-lg">{formattedUserDetails.stakedAmount} tokens</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Stake Date</p>
                  <p className="font-medium">
                    {isClient ? new Date(formattedUserDetails.lastStakeTimestamp * 1000).toLocaleDateString() : 'Loading...'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Pending Rewards</p>
                  <p className="font-semibold text-green-600">{formattedUserDetails.pendingRewards} tokens</p>
                </div>
                <div>
                  <p className="text-gray-600">Lock Duration</p>
                  <p className="font-medium">{minLockDuration ? Number(minLockDuration) / (24 * 60 * 60) : 0} days</p>
                </div>
              </div>

              {!formattedUserDetails.canWithdraw && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🔒 Your stake is locked until {isClient ? new Date((formattedUserDetails.lastStakeTimestamp + formattedUserDetails.timeUntilUnlock) * 1000).toLocaleString() : 'calculating...'}.
                    You can claim rewards anytime but cannot withdraw until the lock period ends.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Log Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">Activity log coming soon!</p>
          <p className="text-sm text-gray-500">
            This will show your staking history, rewards claimed, and withdrawals.
          </p>
        </div>
      </div>
    </div>
  );
}
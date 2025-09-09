'use client';

import { useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { STAKING_ABI } from '@/config/abi';
import { formatEther, WalletClient } from 'viem';

interface Stake {
  id: number;
  amount: string;
  startTime: number;
  endTime: number;
  rewardDebt: string;
}

interface StakePositionsProps {
  account: string;
  walletClient: WalletClient;
}

export default function StakePositions({ account, walletClient }: StakePositionsProps) {
  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'getUserStakes',
        args: [account],
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'pendingRewards',
        args: [account],
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'totalStaked',
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'rewardRate',
      },
      {
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'apr',
      },
    ],
  });

  if (isLoading) return <div>Loading...</div>;

  const userStakes = data?.[0]?.result as readonly [bigint, bigint, bigint, bigint, bigint][];
  const pendingRewards = data?.[1]?.result as bigint;
  const totalStaked = data?.[2]?.result as bigint;
  const rewardRate = data?.[3]?.result as bigint;
  const apr = data?.[4]?.result as bigint;

  const formattedStakes: Stake[] = userStakes?.map((stake, index: number) => ({
    id: index,
    amount: formatEther(stake[1]),
    startTime: Number(stake[2]),
    endTime: Number(stake[3]),
    rewardDebt: formatEther(stake[4]),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Protocol Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Protocol Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Your Pending Rewards</p>
            <p className="text-lg font-bold text-blue-600">
              {pendingRewards ? formatEther(pendingRewards) : '0'} ETH
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Protocol Staked</p>
            <p className="text-lg font-bold text-green-600">
              {totalStaked ? formatEther(totalStaked) : '0'} ETH
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Reward Rate</p>
            <p className="text-lg font-bold text-purple-600">
              {rewardRate ? formatEther(rewardRate) : '0'} ETH
            </p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">APR</p>
            <p className="text-lg font-bold text-orange-600">
              {apr ? formatEther(apr) : '0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Your Stakes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Your Stake Positions</h2>
        {formattedStakes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <p className="text-gray-600">No stakes found. Start staking to see your positions here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formattedStakes.map((stake, index) => {
              const now = Date.now() / 1000;
              const isLocked = now < stake.endTime;
              const daysLeft = isLocked ? Math.ceil((stake.endTime - now) / (24 * 60 * 60)) : 0;

              return (
                <div key={stake.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">Stake #{index + 1}</h3>
                      <p className="text-sm text-gray-600">ID: {stake.id}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isLocked ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {isLocked ? `Locked (${daysLeft} days left)` : 'Unlocked'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Amount Staked</p>
                      <p className="font-semibold text-lg">{stake.amount} ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Start Date</p>
                      <p className="font-medium">{new Date(stake.startTime * 1000).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Date</p>
                      <p className="font-medium">{new Date(stake.endTime * 1000).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rewards Earned</p>
                      <p className="font-semibold text-green-600">{stake.rewardDebt} ETH</p>
                    </div>
                  </div>

                  {isLocked && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        🔒 This stake is locked until {new Date(stake.endTime * 1000).toLocaleString()}.
                        You can claim rewards anytime but cannot withdraw until the lock period ends.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
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
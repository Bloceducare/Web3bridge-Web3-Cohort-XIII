'use client';

import { useStakingContract, usePendingRewards } from '../hooks/useStaking';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

export function ClaimRewards() {
  const { address } = useAccount();
  const { claimRewards, isPending } = useStakingContract();
  const { data: pendingRewards } = usePendingRewards(address);

  const handleClaim = () => {
    claimRewards();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-green-800">Claim Rewards</h2>
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-gray-600">Pending Rewards</p>
          <p className="text-3xl font-bold text-green-600">
            {pendingRewards ? formatEther(pendingRewards) : '0.00'} STK
          </p>
        </div>
        <button
          onClick={handleClaim}
          disabled={isPending || !pendingRewards || pendingRewards === 0n}
          className="w-full bg-yellow-600 text-white py-2 px-4 cursor-pointer rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Claiming...' : 'Claim Rewards'}
        </button>
      </div>
    </div>
  );
}
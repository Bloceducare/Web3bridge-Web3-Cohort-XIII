import { FaGift, FaSpinner } from 'react-icons/fa';
import { useStaking, useUserStakeDetails } from '../hooks/useStaking';
import { formatEther } from 'viem';

export function RewardsSection() {
  const { claimRewards, isLoading } = useStaking();
  const { userDetails } = useUserStakeDetails();

  const handleClaimRewards = async () => {
    await claimRewards();
  };

  const pendingRewards = userDetails?.pendingRewards ?? 0n;
  const hasRewards = pendingRewards > 0n;

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
          <FaGift className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rewards</h2>
          <p className="text-gray-600">Claim your staking rewards</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700 mb-2">
              {formatEther(pendingRewards)} STK
            </div>
            <div className="text-sm text-green-600">
              Available Rewards
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ≈ ${(Number(formatEther(pendingRewards)) * 1).toFixed(2)} USD
            </div>
          </div>
        </div>

        <button
          onClick={handleClaimRewards}
          disabled={!hasRewards || isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <FaGift />
              {hasRewards ? 'Claim Rewards' : 'No Rewards Available'}
            </>
          )}
        </button>

        {hasRewards && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">
              <strong>Ready to claim:</strong> You have earned {formatEther(pendingRewards)} STK tokens in rewards!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { FaClock, FaCoins, FaChartLine } from 'react-icons/fa';
import { useUserStakeDetails } from '../hooks/useStaking';
import { formatEther } from 'viem';

export function UserStakePosition() {
  const { userDetails, isLoading } = useUserStakeDetails();

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userDetails || userDetails.stakedAmount === 0n) {
    return (
      <div className="card border-dashed border-2 border-gray-300 bg-gray-50">
        <div className="text-center py-8">
          <FaCoins className="text-gray-400 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Stakes</h3>
          <p className="text-gray-500">Start staking to see your position here</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: bigint) => {
    const secs = Number(seconds);
    if (secs === 0) return 'Unlocked';
    
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const stakingDate = new Date(Number(userDetails.lastStakeTimestamp) * 1000);

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
          <FaChartLine className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Your Stake Position</h2>
          <p className="text-gray-600">Overview of your current staking position</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <FaCoins className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Staked Amount</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatEther(userDetails.stakedAmount)} STK
            </div>
            <div className="text-xs text-blue-600">
              ≈ ${(Number(formatEther(userDetails.stakedAmount)) * 1).toFixed(2)} USD
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <FaCoins className="text-green-600" />
              <span className="text-sm font-medium text-green-800">Pending Rewards</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatEther(userDetails.pendingRewards)} STK
            </div>
            <div className="text-xs text-green-600">
              ≈ ${(Number(formatEther(userDetails.pendingRewards)) * 1).toFixed(2)} USD
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <FaClock className="text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Lock Status</span>
            </div>
            <div className="text-lg font-bold text-orange-900">
              {formatTime(userDetails.timeUntilUnlock)}
            </div>
            <div className={`text-xs ${userDetails.canWithdraw ? 'text-green-600' : 'text-orange-600'}`}>
              {userDetails.canWithdraw ? 'Ready to withdraw' : 'Still locked'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <FaClock className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Last Stake Date</span>
            </div>
            <div className="text-lg font-bold text-purple-900">
              {stakingDate.toLocaleDateString()}
            </div>
            <div className="text-xs text-purple-600">
              {stakingDate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Value</div>
            <div className="text-xl font-bold text-gray-800">
              {formatEther(userDetails.stakedAmount + userDetails.pendingRewards)} STK
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Withdrawal Status</div>
            <div className={`text-sm font-semibold ${userDetails.canWithdraw ? 'text-green-600' : 'text-orange-600'}`}>
              {userDetails.canWithdraw ? '✓ Available' : '⏳ Locked'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

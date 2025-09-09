import { FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { useStaking, useUserStakeDetails } from '../hooks/useStaking';
import { formatEther } from 'viem';
import { useState } from 'react';

export function EmergencyWithdraw() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { emergencyWithdraw, isLoading } = useStaking();
  const { userDetails } = useUserStakeDetails();

  const handleEmergencyWithdraw = async () => {
    await emergencyWithdraw();
    setShowConfirm(false);
  };

  const stakedAmount = userDetails?.stakedAmount ?? 0n;
  const hasStake = stakedAmount > 0n;
  const penalty = hasStake ? (stakedAmount * 20n) / 100n : 0n; // 20% penalty
  const withdrawAmount = stakedAmount - penalty;

  if (!showConfirm) {
    return (
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-500 rounded-lg">
            <FaExclamationTriangle className="text-white text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-800">Emergency Withdraw</h2>
            <p className="text-red-600">Withdraw immediately with penalty</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-800">
                  {formatEther(stakedAmount)} STK
                </div>
                <div className="text-sm text-gray-600">Staked Amount</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {formatEther(penalty)} STK
                </div>
                <div className="text-sm text-gray-600">Penalty (20%)</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <div className="text-xl font-bold text-green-600">
                {formatEther(withdrawAmount)} STK
              </div>
              <div className="text-sm text-gray-600">You'll Receive</div>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={!hasStake || isLoading}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FaExclamationTriangle />
            {hasStake ? 'Emergency Withdraw' : 'No Staked Tokens'}
          </button>

          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              <strong>Warning:</strong> Emergency withdrawal will result in a 20% penalty on your staked amount. 
              Only use this if you need immediate access to your funds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-red-300 bg-red-100">
      <div className="text-center space-y-4">
        <div className="p-4 bg-red-500 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
          <FaExclamationTriangle className="text-white text-3xl" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Confirm Emergency Withdrawal</h3>
          <p className="text-red-700">
            Are you sure you want to proceed? This action cannot be undone.
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-red-200">
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-600">You will lose</div>
            <div className="text-2xl font-bold text-red-600">
              {formatEther(penalty)} STK
            </div>
            <div className="text-sm text-gray-600">as penalty</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleEmergencyWithdraw}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Withdrawal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

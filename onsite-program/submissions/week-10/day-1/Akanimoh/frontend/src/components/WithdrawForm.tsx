import { useState } from 'react';
import { FaArrowUp, FaSpinner } from 'react-icons/fa';
import { useStaking, useUserStakeDetails } from '../hooks/useStaking';
import { formatEther } from 'viem';

export function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const { withdraw, isLoading } = useStaking();
  const { userDetails } = useUserStakeDetails();

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) return;
    await withdraw(amount);
    setAmount('');
  };

  const setMaxAmount = () => {
    if (userDetails?.stakedAmount) {
      setAmount(formatEther(userDetails.stakedAmount));
    }
  };

  const canWithdraw = userDetails?.canWithdraw ?? false;
  const stakedAmount = userDetails?.stakedAmount ?? 0n;
  const timeUntilUnlock = userDetails?.timeUntilUnlock ?? 0n;

  const formatTime = (seconds: bigint) => {
    const secs = Number(seconds);
    if (secs === 0) return 'Unlocked';
    
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-primary-pink to-primary-blue rounded-lg">
          <FaArrowUp className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Withdraw Tokens</h2>
          <p className="text-gray-600">Withdraw your staked tokens</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Staked Amount</span>
            <span className="text-lg font-bold text-gray-800">
              {formatEther(stakedAmount)} STK
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Unlock Status</span>
            <span className={`text-sm font-semibold ${canWithdraw ? 'text-green-600' : 'text-orange-600'}`}>
              {formatTime(timeUntilUnlock)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Withdraw
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input-field pr-20"
              step="0.01"
              min="0"
              disabled={!canWithdraw}
            />
            <button
              type="button"
              onClick={setMaxAmount}
              disabled={!canWithdraw}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-blue hover:text-primary-pink transition-colors text-sm font-semibold disabled:opacity-50"
            >
              MAX
            </button>
          </div>
        </div>

        <button
          onClick={handleWithdraw}
          disabled={!amount || Number(amount) <= 0 || isLoading || !canWithdraw || Number(amount) > Number(formatEther(stakedAmount))}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              Withdrawing...
            </>
          ) : (
            <>
              <FaArrowUp />
              {canWithdraw ? `Withdraw ${amount || '0'} STK` : 'Locked - Cannot Withdraw'}
            </>
          )}
        </button>

        {!canWithdraw && timeUntilUnlock > 0n && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-800 text-sm">
              <strong>Withdrawal locked:</strong> You need to wait {formatTime(timeUntilUnlock)} before you can withdraw.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

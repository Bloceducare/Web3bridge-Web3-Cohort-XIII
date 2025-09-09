import { useState } from 'react';
import { FaCoins, FaSpinner } from 'react-icons/fa';
import { useStaking, useTokenBalance, useTokenAllowance, useTokenApproval } from '../hooks/useStaking';
import { formatEther, parseEther } from 'viem';

export function StakeForm() {
  const [amount, setAmount] = useState('');
  const { stake, isLoading: stakeLoading } = useStaking();
  const { approve, isLoading: approveLoading } = useTokenApproval();
  const { balance, formattedBalance } = useTokenBalance();
  const { allowance } = useTokenAllowance();

  const needsApproval = allowance && amount ? 
    parseEther(amount) > allowance : 
    true;

  const handleStake = async () => {
    if (!amount || Number(amount) <= 0) return;
    
    if (needsApproval) {
      await approve(amount);
    } else {
      await stake(amount);
    }
  };

  const setMaxAmount = () => {
    if (balance) {
      setAmount(formatEther(balance));
    }
  };

  const isButtonLoading = stakeLoading || approveLoading;

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-primary-pink to-primary-blue rounded-lg">
          <FaCoins className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Stake Tokens</h2>
          <p className="text-gray-600">Stake your STK tokens to earn rewards</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Stake
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
            />
            <button
              type="button"
              onClick={setMaxAmount}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-blue hover:text-primary-pink transition-colors text-sm font-semibold"
            >
              MAX
            </button>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Balance: {formattedBalance} STK</span>
            {amount && (
              <span>≈ ${(Number(amount) * 1).toFixed(2)} USD</span>
            )}
          </div>
        </div>

        <button
          onClick={handleStake}
          disabled={!amount || Number(amount) <= 0 || isButtonLoading || !balance || parseEther(amount || '0') > balance}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isButtonLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              {needsApproval ? 'Approving...' : 'Staking...'}
            </>
          ) : (
            <>
              <FaCoins />
              {needsApproval ? `Approve ${amount} STK` : `Stake ${amount} STK`}
            </>
          )}
        </button>

        {needsApproval && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>Approval needed:</strong> You need to approve the staking contract to spend your tokens first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

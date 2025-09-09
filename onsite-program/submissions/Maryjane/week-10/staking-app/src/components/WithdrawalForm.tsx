'use client';

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { STAKING_ABI } from '@/config/abi';
import { parseEther, formatEther, WalletClient } from 'viem';

interface WithdrawalFormProps {
  walletClient: WalletClient;
  onWithdraw: () => void;
}

export default function WithdrawalForm({ walletClient, onWithdraw }: WithdrawalFormProps) {
  const [amount, setAmount] = useState('');
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [successMessage, setSuccessMessage] = useState('');

  const { writeContract, isPending, data } = useWriteContract();

  // Get user details to show available balance
  const { data: userDetails, isLoading: isUserDetailsLoading, error: userDetailsError } = useReadContract({
    address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
    abi: STAKING_ABI,
    functionName: 'getUserDetails',
    args: [walletClient?.account?.address as `0x${string}`],
    query: {
      enabled: !!walletClient?.account?.address,
    },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  React.useEffect(() => {
    if (data) {
      setHash(data);
    }
  }, [data]);

  React.useEffect(() => {
    if (isSuccess) {
      setSuccessMessage(`Successfully withdrawn ${amount} tokens!`);
      setAmount('');
      onWithdraw();
      setHash(undefined);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [isSuccess, onWithdraw, amount]);

  const handleWithdraw = () => {
    if (!walletClient || !amount) return;

    const amountValue = parseFloat(amount);
    const stakedValue = parseFloat(userStakedAmount);

    if (amountValue > stakedValue) {
      alert('Cannot withdraw more than your staked amount');
      return;
    }

    if (amountValue <= 0) {
      alert('Please enter a valid amount to withdraw');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'withdraw',
        args: [parseEther(amount)],
      });
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed: ' + (error as Error).message);
    }
  };

  const userStakedAmount = userDetails ? formatEther(userDetails.stakedAmount) : '0';
  const canWithdraw = userDetails ? userDetails.canWithdraw : false;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Withdraw Stake</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        <p>Staked Amount: {userStakedAmount} tokens</p>
        <p>Can Withdraw: {canWithdraw ? 'Yes' : 'No (locked)'}</p>
      </div>

      <div className="flex gap-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to withdraw"
          className="flex-1 p-2 border rounded"
          disabled={isPending || !canWithdraw}
          max={userStakedAmount}
          min="0"
          step="0.001"
        />
        <button
          onClick={handleWithdraw}
          disabled={isPending || isConfirming || !walletClient || !amount || !canWithdraw}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-green-600 transition-colors"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Withdraw'}
        </button>
      </div>

      {!canWithdraw && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            🔒 Your stake is still locked. You cannot withdraw until the lock period ends.
          </p>
        </div>
      )}
    </div>
  );
}
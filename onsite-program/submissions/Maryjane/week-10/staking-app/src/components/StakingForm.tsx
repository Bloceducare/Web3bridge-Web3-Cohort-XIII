'use client';

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { STAKING_ABI } from '@/config/abi';
import { parseEther, WalletClient } from 'viem';

interface StakingFormProps {
  walletClient: WalletClient;
  onStake: () => void;
}

export default function StakingForm({ walletClient, onStake }: StakingFormProps) {
  const [amount, setAmount] = useState('');
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [successMessage, setSuccessMessage] = useState('');

  const { writeContract, isPending, data } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Update hash when transaction is sent
  React.useEffect(() => {
    if (data) {
      setHash(data);
    }
  }, [data]);

  // Handle success
  React.useEffect(() => {
    if (isSuccess) {
      setSuccessMessage(`Successfully staked ${amount} ETH!`);
      setAmount('');
      onStake(); // Refresh data
      setHash(undefined);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [isSuccess, onStake, amount]);

  const handleStake = async () => {
    if (!walletClient || !amount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [parseEther(amount)],
        value: parseEther(amount), // Send ETH with the transaction
      });
    } catch (error) {
      console.error('Staking failed:', error);
      alert('Staking failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Stake Tokens</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ {successMessage}
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to stake (min: 0.001 ETH)"
          className="flex-1 p-2 border rounded"
          disabled={isPending || isConfirming}
          min="0.001"
          step="0.001"
        />
        <button
          onClick={handleStake}
          disabled={isPending || isConfirming || !walletClient || !amount}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Stake'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 Minimum stake: 0.001 ETH</p>
        <p>⏰ Lock period: 1 year</p>
        <p>🎁 Annual rewards: 10%</p>
      </div>
    </div>
  );
}
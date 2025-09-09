'use client';

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { STAKING_ABI } from '@/config/abi';
import { WalletClient } from 'viem';

interface EmergencyWithdrawalProps {
  walletClient: WalletClient;
  onEmergencyWithdraw: () => void;
}

export default function EmergencyWithdrawal({ walletClient, onEmergencyWithdraw }: EmergencyWithdrawalProps) {
  const [stakeId, setStakeId] = useState('');
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { writeContract, isPending, data } = useWriteContract();

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
      alert('Emergency withdrawal successful!');
      setStakeId('');
      onEmergencyWithdraw();
      setHash(undefined);
    }
  }, [isSuccess, onEmergencyWithdraw]);

  const handleEmergencyWithdraw = () => {
    if (!walletClient || !stakeId) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'emergencyWithdraw',
        args: [BigInt(stakeId)],
      });
    } catch (error) {
      console.error('Emergency withdrawal failed:', error);
      alert('Emergency withdrawal failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Emergency Withdrawal</h2>
      <div className="flex gap-4">
        <input
          type="number"
          value={stakeId}
          onChange={(e) => setStakeId(e.target.value)}
          placeholder="Stake ID"
          className="flex-1 p-2 border rounded"
          disabled={isPending}
        />
        <button
          onClick={handleEmergencyWithdraw}
          disabled={isPending || isConfirming || !walletClient || !stakeId}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Emergency Withdraw'}
        </button>
      </div>
    </div>
  );
}
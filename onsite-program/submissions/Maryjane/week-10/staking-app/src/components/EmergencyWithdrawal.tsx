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
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [successMessage, setSuccessMessage] = useState('');

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
      setSuccessMessage('Emergency withdrawal successful!');
      onEmergencyWithdraw();
      setHash(undefined);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [isSuccess, onEmergencyWithdraw]);

  const handleEmergencyWithdraw = () => {
    if (!walletClient) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'emergencyWithdraw',
      });
    } catch (error) {
      console.error('Emergency withdrawal failed:', error);
      alert('Emergency withdrawal failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Emergency Withdrawal</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
        <p className="text-sm text-red-800">
          ⚠️ Emergency withdrawal will incur a penalty. Only use this if you cannot wait for the lock period to end.
        </p>
      </div>

      <button
        onClick={handleEmergencyWithdraw}
        disabled={isPending || isConfirming || !walletClient}
        className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-red-700 transition-colors w-full"
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Emergency Withdraw All'}
      </button>
    </div>
  );
}
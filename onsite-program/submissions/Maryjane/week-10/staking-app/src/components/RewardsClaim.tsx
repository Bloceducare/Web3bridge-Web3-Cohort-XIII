'use client';

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { STAKING_ABI } from '@/config/abi';
import { WalletClient } from 'viem';

interface RewardsClaimProps {
  walletClient: WalletClient;
  onClaim: () => void;
}

export default function RewardsClaim({ walletClient, onClaim }: RewardsClaimProps) {
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
      setSuccessMessage('Rewards claimed successfully!');
      onClaim();
      setHash(undefined);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [isSuccess, onClaim]);

  const handleClaim = () => {
    if (!walletClient) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'claimRewards',
      });
    } catch (error) {
      console.error('Claim failed:', error);
      alert('Claim failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Claim Rewards</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={isPending || isConfirming || !walletClient}
        className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-yellow-600 transition-colors w-full"
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Claim All Rewards'}
      </button>
    </div>
  );
}
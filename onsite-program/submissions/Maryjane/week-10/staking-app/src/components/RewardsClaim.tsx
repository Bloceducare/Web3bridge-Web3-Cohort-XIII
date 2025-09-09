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
      alert('Rewards claimed successfully!');
      setStakeId('');
      onClaim();
      setHash(undefined);
    }
  }, [isSuccess, onClaim]);

  const handleClaim = () => {
    if (!walletClient || !stakeId) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
        abi: STAKING_ABI,
        functionName: 'claimRewards',
        args: [BigInt(stakeId)],
      });
    } catch (error) {
      console.error('Claim failed:', error);
      alert('Claim failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Claim Rewards</h2>
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
          onClick={handleClaim}
          disabled={isPending || isConfirming || !walletClient || !stakeId}
          className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Claim Rewards'}
        </button>
      </div>
    </div>
  );
}
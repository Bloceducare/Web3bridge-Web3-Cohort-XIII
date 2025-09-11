'use client';

import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { STAKING_ABI } from '@/config/abi';
import { parseEther, formatEther, WalletClient } from 'viem';

interface StakingFormProps {
  walletClient: WalletClient;
  onStake: () => void;
}

export default function StakingForm({ walletClient, onStake }: StakingFormProps) {
  const [amount, setAmount] = useState('');
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [successMessage, setSuccessMessage] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const { writeContract, isPending, data } = useWriteContract();

  // Get staking token address
  const { data: stakingToken } = useReadContract({
    address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
    abi: STAKING_ABI,
    functionName: 'stakingToken',
  });

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
      setSuccessMessage(`Successfully staked ${amount} tokens!`);
      setAmount('');
      onStake(); // Refresh data
      setHash(undefined);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [isSuccess, onStake, amount]);

  const handleApproveAndStake = async () => {
    if (!walletClient || !amount || !stakingToken) return;

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      alert('Please enter a valid amount to stake');
      return;
    }

    if (amountValue < 0.001) {
      alert('Minimum stake amount is 0.001 tokens');
      return;
    }

    try {
      setIsApproving(true);

      // First approve the staking contract to spend tokens
      writeContract({
        address: stakingToken as `0x${string}`,
        abi: [
          {
            inputs: [
              { internalType: "address", name: "spender", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" }
            ],
            name: "approve",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function"
          }
        ],
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.STAKING_CONTRACT, parseEther(amount)],
      });

      // After approval, stake the tokens
      setTimeout(() => {
        writeContract({
          address: CONTRACT_ADDRESSES.STAKING_CONTRACT,
          abi: STAKING_ABI,
          functionName: 'stake',
          args: [parseEther(amount)],
        });
        setIsApproving(false);
      }, 2000);

    } catch (error) {
      console.error('Staking failed:', error);
      alert('Staking failed: ' + (error as Error).message);
      setIsApproving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Stake Tokens</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to stake"
          className="flex-1 p-2 border rounded"
          disabled={isPending || isConfirming || isApproving}
          min="0"
          step="0.001"
        />
        <button
          onClick={handleApproveAndStake}
          disabled={isPending || isConfirming || isApproving || !walletClient || !amount}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
        >
          {isApproving ? 'Approving...' : isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Stake'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p> This contract uses ERC20 tokens for staking</p>
        <p> You need to approve the contract first, then stake</p>
      </div>
    </div>
  );
}
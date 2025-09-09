import React from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS, ERC20_ABI } from '../config/contracts';

/**
 * SimpleMint - Direct Wagmi approach to mint tokens
 */
const SimpleMint = () => {
  const { address, isConnected } = useAccount();
  
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const handleMint = async () => {
    try {
      writeContract({
        address: CONTRACTS.MOCK_ERC20,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [address, parseEther('10000')], // Mint 10,000 tokens
      });
    } catch (err) {
      console.error('Mint error:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please connect your wallet to mint tokens.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-1">
             Get Test Tokens (Wagmi Version)
          </h3>
          <p className="text-blue-600 text-sm">
            Mint 10,000 MTK tokens directly using Wagmi
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={handleMint}
            disabled={isPending || isConfirming}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
          >
            {isPending ? 'Preparing...' : isConfirming ? 'Confirming...' : 'Mint 10K Tokens'}
          </button>
          
          {/* Status messages */}
          <div className="mt-2 text-sm">
            {hash && <p className="text-blue-600">Transaction: {hash.slice(0, 10)}...</p>}
            {isConfirmed && <p className="text-green-600"> Success!</p>}
            {error && <p className="text-red-600"> {error.shortMessage || error.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMint;

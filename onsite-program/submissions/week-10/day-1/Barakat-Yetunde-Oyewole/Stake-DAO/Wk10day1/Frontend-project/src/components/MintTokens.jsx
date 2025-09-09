import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useStakingData, useStakingActions } from '../hooks/useContracts';
import { parseTokenAmount, formatTokenAmount } from '../utils';

/**
 * MintTokens component - Simple button to get test tokens
 * This is useful for development/testing when users need tokens
 */
const MintTokens = () => {
  const { isConnected, isCorrectChain } = useWeb3();
  const { tokenBalance, refetch } = useStakingData();
  const { mintTokens, isLoading } = useStakingActions();

  /**
   * Mint 50,000 test tokens to user's address
   */
  const handleMintTokens = async () => {
    try {
      const mintAmount = parseTokenAmount('50000'); // Mint 50,000 tokens
      
      await mintTokens(mintAmount);
      
      // Wait a bit for the transaction to be fully processed on the blockchain
      console.log('Mint successful, waiting for blockchain confirmation...');
      
      // First refresh after 2 seconds
      setTimeout(async () => {
        console.log('First refresh attempt...');
        await refetch();
      }, 2000);
      
      // Second refresh after 4 seconds
      setTimeout(async () => {
        console.log('Second refresh attempt...');
        await refetch();
      }, 4000);
      
      // Third refresh after 6 seconds
      setTimeout(async () => {
        console.log('Third refresh attempt...');
        await refetch();
      }, 6000);
      
      alert('🎉 Tokens successfully minted to your wallet!');
    } catch (error) {
      console.error('Failed to mint tokens:', error);
      alert('Failed to mint tokens: ' + error.message);
    }
  };

  // Don't show if wallet not connected or wrong network
  if (!isConnected || !isCorrectChain) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">
            🎁 Get Test Tokens
          </h3>
          <p className="text-green-600 text-sm mb-1">
            Get free MTK tokens to start staking and testing the platform
          </p>
          <p className="text-green-700 text-xs">
            Current Balance: <strong>{formatTokenAmount(tokenBalance)} MTK</strong>
          </p>
        </div>
        <button
          onClick={handleMintTokens}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
        >
          {isLoading ? 'Minting...' : 'Get 50K Tokens'}
        </button>
      </div>
    </div>
  );
};

export default MintTokens;

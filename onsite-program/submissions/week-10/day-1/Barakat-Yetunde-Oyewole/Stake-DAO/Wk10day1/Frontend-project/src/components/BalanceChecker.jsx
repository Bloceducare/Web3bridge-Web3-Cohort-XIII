import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useContracts } from '../hooks/useContracts';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

/**
 * BalanceChecker - Simple component to directly check token balance
 */
const BalanceChecker = () => {
  const { account, isConnected } = useWeb3();
  const { tokenContract } = useContracts();
  const [balance, setBalance] = useState('Not checked');
  const [isChecking, setIsChecking] = useState(false);

  const checkBalanceDirectly = async () => {
    if (!tokenContract || !account) {
      setBalance('Contract or account not available');
      return;
    }

    try {
      setIsChecking(true);
      console.log('🔍 Direct balance check starting...');
      console.log('Account:', account);
      console.log('Token contract address:', CONTRACTS.MOCK_ERC20);
      console.log('Contract target:', tokenContract.target);
      
      // Direct contract call
      const rawBalance = await tokenContract.balanceOf(account);
      console.log('Raw balance returned:', rawBalance.toString());
      
      // Format for display
      const formattedBalance = ethers.formatEther(rawBalance);
      console.log('Formatted balance:', formattedBalance);
      
      setBalance(`${formattedBalance} MTK (${rawBalance.toString()} wei)`);
    } catch (error) {
      console.error('❌ Balance check failed:', error);
      setBalance(`Error: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-yellow-800">Connect wallet to check balance</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-900 mb-3">🔍 Direct Balance Checker</h4>
      
      <div className="space-y-2">
        <p className="text-sm">
          <strong>Account:</strong> {account?.slice(0, 10)}...{account?.slice(-6)}
        </p>
        <p className="text-sm">
          <strong>Token Contract:</strong> {CONTRACTS.MOCK_ERC20}
        </p>
        <p className="text-sm">
          <strong>Balance:</strong> {balance}
        </p>
      </div>
      
      <button
        onClick={checkBalanceDirectly}
        disabled={isChecking}
        className="mt-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
      >
        {isChecking ? 'Checking...' : '🔄 Check Balance Now'}
      </button>
    </div>
  );
};

export default BalanceChecker;

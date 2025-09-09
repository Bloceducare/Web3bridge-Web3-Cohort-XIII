import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useStakingData, useStakingActions } from '../hooks/useContracts';
import { formatTokenAmount, parseTokenAmount } from '../utils';

/**
 * StakingForm component - Allows users to stake their tokens
 * Handles the approve + stake flow that's required for ERC20 tokens
 */
const StakingForm = () => {
  // Get wallet connection status
  const { isConnected, isCorrectChain } = useWeb3();
  
  // Get user's token data and functions to refresh it
  const { tokenBalance, tokenAllowance, refetch } = useStakingData();
  
  // Get functions to interact with contracts
  const { approveTokens, stake, isLoading } = useStakingActions();
  
  // Local state for the form
  const [amount, setAmount] = useState(''); // Amount user wants to stake
  const [step, setStep] = useState('input'); // Track which step we're on: 'input', 'approve', 'stake'

  /**
   * Handle form submission - either approve tokens or stake them
   * ERC20 tokens require 2 steps: approve first, then stake
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    
    // Validate input
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      // Convert user input to blockchain format (with 18 decimals)
      const amountBigInt = parseTokenAmount(amount);
      
      // Check if we need to approve tokens first
      if (tokenAllowance < amountBigInt) {
        console.log('Need to approve tokens first...');
        setStep('approve');
        
        // Call approve function on token contract
        await approveTokens(amountBigInt);
        
        // Refresh data to get updated allowance
        await refetch();
        setStep('stake');
      }
      
      // If we have enough allowance (or just approved), stake the tokens
      if (step === 'stake' || tokenAllowance >= amountBigInt) {
        console.log('Staking tokens...');
        await stake(amountBigInt);
        
        // Reset form and refresh data
        setAmount('');
        setStep('input');
        await refetch();
        alert('Staking successful! 🎉');
      }
    } catch (error) {
      console.error('Staking error:', error);
      alert('Staking failed: ' + error.message);
      setStep('input'); // Reset to initial state
    }
  };

  /**
   * Set the amount to user's maximum available balance
   */
  const handleMaxAmount = () => {
    setAmount(formatTokenAmount(tokenBalance, 18, 6)); // Show 6 decimal places for precision
  };


  // Check if the entered amount is valid
  const isValidAmount = amount && parseFloat(amount) > 0 && parseTokenAmount(amount) <= tokenBalance;

  // Show connection prompt if wallet not connected
  if (!isConnected) {
    return (
      <div className="card" id="stake">
        <h2 className="text-xl font-bold mb-4">💰 Stake Tokens</h2>
        <p className="text-gray-500 text-center py-8">
          Please connect your wallet to start staking
        </p>
      </div>
    );
  }

  // Show network prompt if on wrong chain
  if (!isCorrectChain) {
    return (
      <div className="card" id="stake">
        <h2 className="text-xl font-bold mb-4">💰 Stake Tokens</h2>
        <p className="text-gray-500 text-center py-8">
          Please switch to Sepolia network to start staking
        </p>
      </div>
    );
  }

  return (
    <div className="card" id="stake">
      <h2 className="text-xl font-bold mb-6">💰 Stake Tokens</h2>
      
      {/* Balance Display - Show user how many tokens they have */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Your Balance:</span>
            <span className="font-semibold ml-2">{formatTokenAmount(tokenBalance)} Tokens</span>
          </div>
          <div className="flex gap-2">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                console.log('Manual refresh triggered');
                refetch();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Amount Input Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Stake
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input-field pr-16" // Extra padding on right for MAX button
              step="0.000001" // Allow small decimal inputs
              min="0"
            />
            {/* MAX button inside the input field */}
            <button
              type="button"
              onClick={handleMaxAmount}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-600 text-sm font-medium hover:text-primary-700"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Staking Information - Only show when user enters an amount */}
        {amount && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Lock Duration:</span>
              <span className="font-medium">1 day minimum</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Emergency Withdraw Penalty:</span>
              <span className="font-medium text-red-600">50%</span>
            </div>
          </div>
        )}

        {/* Submit Button - Changes text based on current step */}
        <button
          type="submit"
          disabled={!isValidAmount || isLoading}
          className="btn-primary w-full"
        >
          {isLoading
            ? step === 'approve'
              ? 'Approving...' // First transaction: approving tokens
              : 'Staking...'   // Second transaction: actually staking
            : tokenAllowance >= parseTokenAmount(amount || '0')
            ? 'Stake Tokens'   // Already approved, ready to stake
            : 'Approve & Stake'} {/* Need to approve first */}
        </button>

        {/* Validation Error Messages */}
        {!isValidAmount && amount && (
          <p className="text-red-500 text-sm">
            {parseTokenAmount(amount) > tokenBalance
              ? 'Insufficient balance' // User doesn't have enough tokens
              : 'Please enter a valid amount'} {/* Invalid number format */}
          </p>
        )}
      </form>
    </div>
  );
};

export default StakingForm;
'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  WalletProvider,
  initializeEIP6963,
  getAvailableWalletProviders,
  connectWallet,
  connectLegacyWallet,
  discoveredWallets
} from '@/config/walletProviders';

interface WalletState {
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  error: string | null;
  availableWallets: WalletProvider[];
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnecting: false,
    isConnected: false,
    address: null,
    provider: null,
    signer: null,
    error: null,
    availableWallets: [],
  });

  // Initialize EIP-6963 wallet discovery
  useEffect(() => {
    // Initialize EIP-6963 wallet discovery
    initializeEIP6963();

    // Set up a listener for new wallet announcements
    const updateWallets = () => {
      setWalletState(prev => ({
        ...prev,
        availableWallets: [...discoveredWallets],
      }));
    };

    // Initial update
    updateWallets();

    // Set up interval to check for new wallets
    const intervalId = setInterval(updateWallets, 1000);

    // Clean up
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Connect to a specific wallet
  const connect = async (walletProvider: WalletProvider) => {
    setWalletState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      const { provider, signer, address } = await connectWallet(walletProvider);

      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        isConnected: true,
        address,
        provider,
        signer,
      }));

      return { provider, signer, address };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
      throw error;
    }
  };

  // Connect using legacy method (window.ethereum)
  const connectLegacy = async () => {
    setWalletState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      const result = await connectLegacyWallet();
      
      if (!result) {
        throw new Error('No legacy wallet available');
      }
      
      const { provider, signer, address } = result;

      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        isConnected: true,
        address,
        provider,
        signer,
      }));

      return { provider, signer, address };
    } catch (error) {
      console.error('Failed to connect legacy wallet:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect legacy wallet',
      }));
      throw error;
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setWalletState({
      isConnecting: false,
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      error: null,
      availableWallets: walletState.availableWallets,
    });
  };

  return {
    ...walletState,
    connect,
    connectLegacy,
    disconnect,
  };
}
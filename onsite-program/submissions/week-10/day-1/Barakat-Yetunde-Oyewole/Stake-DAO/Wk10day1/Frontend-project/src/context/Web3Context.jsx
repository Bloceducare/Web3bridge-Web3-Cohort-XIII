import React, { createContext, useContext, useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { config } from '../config/rainbowkit';

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Inner component that uses Wagmi hooks
const Web3ContextProvider = ({ children }) => {
  const { address: account, isConnected, isConnecting } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  
  const isCorrectChain = chainId === 11155111; // Sepolia chain ID

  // Create ethers provider and signer from Wagmi
  useEffect(() => {
    const setupProvider = async () => {
      try {
        // Create provider for read operations
        if (window.ethereum) {
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethersProvider);
          
          // Create signer for write operations if wallet is connected
          if (isConnected && walletClient) {
            const ethersSigner = await ethersProvider.getSigner();
            setSigner(ethersSigner);
          } else {
            setSigner(null);
          }
        }
      } catch (error) {
        console.error('Error setting up provider/signer:', error);
      }
    };
    
    setupProvider();
  }, [isConnected, walletClient]);

  const value = {
    account,
    isConnected,
    isConnecting,
    chainId,
    isCorrectChain,
    provider,
    signer,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Web3ContextProvider>
            {children}
          </Web3ContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
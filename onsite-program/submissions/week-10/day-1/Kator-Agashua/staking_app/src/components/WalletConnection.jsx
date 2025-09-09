import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletConnection = () => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState('');

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Get provider
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(provider);

          // Get accounts
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setSigner(provider.getSigner());
            setIsConnected(true);

            // Get network
            const network = await provider.getNetwork();
            setChainId(network.chainId);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
          setError('Error checking wallet connection');
        }
      }
    };

    checkConnection();
  }, []);

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setSigner(provider.getSigner());
          setIsConnected(true);
        } else {
          setAccount('');
          setSigner(null);
          setIsConnected(false);
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, [provider]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        setSigner(provider.getSigner());
        
        // Set account
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Get network
        const network = await provider.getNetwork();
        setChainId(network.chainId);
        
        setError('');
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setError('Error connecting wallet');
      }
    } else {
      setError('Ethereum wallet not detected. Please install MetaMask.');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
  };

  return {
    account,
    provider,
    signer,
    isConnected,
    chainId,
    error,
    connectWallet,
    disconnectWallet
  };
};

export default WalletConnection;
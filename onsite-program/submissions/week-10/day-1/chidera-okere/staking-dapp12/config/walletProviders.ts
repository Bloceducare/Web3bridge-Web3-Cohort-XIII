import { ethers } from 'ethers';

// EIP-6963 interfaces
export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

export interface EIP6963RequestProviderEvent extends CustomEvent {
  type: 'eip6963:requestProvider';
}

// Our wallet provider interface
export interface WalletProvider {
  uuid: string;
  name: string;
  icon: string;
  rdns?: string;
  provider: any;
}

// Store for discovered EIP-6963 providers
export const discoveredWallets: WalletProvider[] = [];

// Function to initialize EIP-6963 wallet discovery
export const initializeEIP6963 = (): void => {
  if (typeof window === 'undefined') return;

  // Function to handle wallet announcements
  const handleAnnouncement = (event: EIP6963AnnounceProviderEvent) => {
    const { detail } = event;
    
    // Check if we already have this provider (by UUID)
    const existingProvider = discoveredWallets.find(wallet => wallet.uuid === detail.info.uuid);
    
    if (!existingProvider) {
      // Add the new provider to our list
      discoveredWallets.push({
        uuid: detail.info.uuid,
        name: detail.info.name,
        icon: detail.info.icon,
        rdns: detail.info.rdns,
        provider: detail.provider,
      });
    }
  };

  // Add event listener for wallet announcements
  window.addEventListener('eip6963:announceProvider', handleAnnouncement as EventListener);

  // Request providers to announce themselves
  const requestEvent = new CustomEvent('eip6963:requestProvider');
  window.dispatchEvent(requestEvent);
};

// Function to get all available wallet providers
export const getAvailableWalletProviders = (): WalletProvider[] => {
  return discoveredWallets;
};

// Connect function for EIP-6963 providers
export const connectWallet = async (walletProvider: WalletProvider): Promise<{
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
}> => {
  if (!walletProvider || !walletProvider.provider) {
    throw new Error('No provider available');
  }

  try {
    // Create ethers provider
    const ethersProvider = new ethers.BrowserProvider(walletProvider.provider);
    
    // Request accounts (this will prompt the user to connect)
    const accounts = await ethersProvider.send('eth_requestAccounts', []);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from provider');
    }
    
    const signer = await ethersProvider.getSigner();
    const address = accounts[0];
    
    return {
      provider: ethersProvider,
      signer,
      address,
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

// Fallback for non-EIP-6963 wallets (legacy method)
export const connectLegacyWallet = async (): Promise<{
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
} | null> => {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  
  try {
    const ethersProvider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await ethersProvider.send('eth_requestAccounts', []);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from provider');
    }
    
    const signer = await ethersProvider.getSigner();
    const address = accounts[0];
    
    return {
      provider: ethersProvider,
      signer,
      address,
    };
  } catch (error) {
    console.error('Error connecting legacy wallet:', error);
    return null;
  }
};
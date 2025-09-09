'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';

// This function will be called on the client side
export const getWagmiConfig = () => {
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  if (!projectId) {
    throw new Error('Missing PROJECT_ID environment variable');
  }

  return getDefaultConfig({
    appName: 'Staking App',
    projectId: projectId,
    chains: [sepolia],
    
  });
};

// This config should only be used in client components
export const wagmiConfig = typeof window !== 'undefined' ? getWagmiConfig() : null;

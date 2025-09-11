import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Staking DApp',
  projectId: 'demo-project-id', // Replace with your WalletConnect project ID
  chains: [sepolia],
  ssr: true,
});

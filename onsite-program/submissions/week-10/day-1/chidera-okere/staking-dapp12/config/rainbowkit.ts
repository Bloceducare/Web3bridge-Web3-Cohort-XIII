import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'viem/chains';
import { http } from 'viem';

const projectId = '50ecc024bdb04cee0efc8681e04b7c06';

// Create and export wagmi config using RainbowKit's getDefaultConfig
const wagmiConfig = getDefaultConfig({
  appName: 'Nexus Staking dApp',
  projectId,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  }
});

// Export wagmi config for use in RainbowKitProvider
export { wagmiConfig };
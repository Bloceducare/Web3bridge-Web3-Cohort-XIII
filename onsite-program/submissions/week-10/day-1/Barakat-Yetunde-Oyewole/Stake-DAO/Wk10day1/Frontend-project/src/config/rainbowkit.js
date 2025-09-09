import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'StakeDAO',
  projectId: '7210705c3adb909440d1bf9454893f2c', // Get this from https://walletconnect.com/
  chains: [sepolia],
  ssr: false,
});

export { sepolia };
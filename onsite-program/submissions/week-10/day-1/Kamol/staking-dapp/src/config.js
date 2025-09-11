import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css';

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
})
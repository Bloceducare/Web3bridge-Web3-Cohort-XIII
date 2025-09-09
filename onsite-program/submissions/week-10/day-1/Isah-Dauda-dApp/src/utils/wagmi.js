import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";

const projectId = "YOUR_WALLETCONNECT_PROJECT_ID"; // You'll need to get this from WalletConnect

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    metaMask(),
    coinbaseWallet({
      appName: "Staking dApp",
    }),
    walletConnect({ projectId }),
  ],
  transports: {
    [sepolia.id]: http(
      "https://eth-sepolia.g.alchemy.com/v2/4EkFRqr0TW4yTDAmYR9AO"
    ),
  },
});

export { sepolia };

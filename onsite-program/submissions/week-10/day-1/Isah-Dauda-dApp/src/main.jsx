import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Import Wagmi and RainbowKit providers
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

// Import RainbowKit CSS
import "@rainbow-me/rainbowkit/styles.css";

// Create Wagmi config
const config = getDefaultConfig({
  appName: "Staking dApp",
  projectId: "YOUR_PROJECT_ID", // Get from WalletConnect Cloud
  chains: [sepolia],
  ssr: false,
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000, // 10 seconds
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.tsx";
import Stake from "./components/Stake/Stake.tsx";
import AppLayout from "./components/AppLayout";
import Withdraw from "./components/Withdraw";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import Positions from "./components/Positions";
import RewardClaim from "./components/RewardClaim";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [sepolia],
    transports: {
      // RPC URL for each chain
      [sepolia.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: import.meta.env.VITE_PROJECT_ID,

    // Required App Info
    appName: "StakeWithMe",

    // Optional App Info
  }),
);

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true, // Use 'index' for the default child route
        element: <AppLayout />,
      },
      {
        path: "stake",
        element: <Stake />,
      },
      {
        path: "withdraw",
        element: <Withdraw />,
      },
      {
        path: "positions",
        element: <Positions />,
      },
      {
        path: "/claim",
        element: <RewardClaim />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <RouterProvider router={router} />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);

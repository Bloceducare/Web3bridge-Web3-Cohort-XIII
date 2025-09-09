import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { config } from './config/RainbowkitConfig.js'
import '@rainbow-me/rainbowkit/styles.css';
import {
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';

import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";


const queryClient = new QueryClient();


createRoot(document.getElementById('root')).render(
  <StrictMode>
     <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
    
  </StrictMode>,
)

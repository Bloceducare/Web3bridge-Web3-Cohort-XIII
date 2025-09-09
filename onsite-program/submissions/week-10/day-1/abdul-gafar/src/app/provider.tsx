'use client';
// import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { baseTheme } from '@/ui/assets/styles/theme';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { WagmiProvider } from 'wagmi';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { config } from './config/rainbowkit';


type ProviderProps = {
  children: ReactNode;
}
export function Provider({
  children
}: ProviderProps) {
  const queryClient = new QueryClient();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ThemeProvider theme={baseTheme}>
            <CssBaseline />
            {children}
            <Toaster
              position="top-right"
              richColors
              toastOptions={{
                duration: 3000,
                className: 'custom-toast',
                style: {
                  padding: '12px 16px',
                  borderRadius: '8px',
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
                },
              }}
            />
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

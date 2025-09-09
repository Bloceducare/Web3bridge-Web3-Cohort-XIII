import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Toaster } from 'react-hot-toast';

import { config } from './config/contracts';
import {
  Header,
  StatsCards,
  StakeForm,
  WithdrawForm,
  RewardsSection,
  EmergencyWithdraw,
  UserStakePosition,
} from './components';
import { useContractEvents } from './hooks/useStaking';

const queryClient = new QueryClient();

function DashboardContent() {
  // Initialize contract event listeners for real-time updates
  useContractEvents();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
          <StatsCards />
        </div>

        {/* User Position */}
        <div className="mb-8">
          <UserStakePosition />
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <StakeForm />
          <WithdrawForm />
          <RewardsSection />
        </div>

        {/* Emergency Section */}
        <div className="max-w-2xl mx-auto">
          <EmergencyWithdraw />
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '12px 16px',
          },
          success: {
            style: {
              borderColor: '#10b981',
            },
          },
          error: {
            style: {
              borderColor: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <DashboardContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

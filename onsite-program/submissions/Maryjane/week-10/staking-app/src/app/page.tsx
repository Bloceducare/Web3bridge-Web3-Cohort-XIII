'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';
import { useEffect, useState } from 'react';
import StakingForm from '@/components/StakingForm';
import WithdrawalForm from '@/components/WithdrawalForm';
import RewardsClaim from '@/components/RewardsClaim';
import EmergencyWithdrawal from '@/components/EmergencyWithdrawal';
import StakePositions from '@/components/StakePositions';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.time('Wallet Detection');
    console.log('Wallet detection started');
  }, []);

  useEffect(() => {
    if (isConnected !== undefined) {
      console.timeEnd('Wallet Detection');
      console.log('Wallet detection completed:', { isConnected, address, chain });
    }
  }, [isConnected, address, chain]);

  const handleStake = () => {
    // Refresh data if needed
  };
  const handleWithdraw = () => {
    // Refresh data if needed
  };

  const handleClaim = () => {
    // Refresh data if needed
  };

  const handleEmergencyWithdraw = () => {
    // Refresh data if needed
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">Staking dApp</h1>
        <p className="text-center text-gray-600 mt-2">
          Stake ETH and earn rewards on Sepolia
        </p>
      </header>
      <main className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <ConnectButton />
        </div>

        {!isConnected && (
          <div className="text-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Welcome to the Staking dApp</h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to start staking ETH and earning rewards.
              </p>
              <div className="text-sm text-gray-500">
                <p>Network: Sepolia</p>
                <p>Minimum Stake: 0.001 ETH</p>
                <p>Annual Rewards: 10%</p>
              </div>
            </div>
          </div>
        )}

        {isClient && isConnected && !walletClient && (
          <div className="text-center py-12">
            <div className="bg-yellow-50 p-8 rounded-lg border border-yellow-200">
              <p className="text-yellow-800">Loading wallet client...</p>
            </div>
          </div>
        )}

        {isClient && isConnected && address && walletClient && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Connected Account</h3>
              <p className="text-sm text-gray-600 font-mono">{address}</p>
            </div>

            <StakingForm walletClient={walletClient} onStake={handleStake} />
            <WithdrawalForm walletClient={walletClient} onWithdraw={handleWithdraw} />
            <RewardsClaim walletClient={walletClient} onClaim={handleClaim} />
            <EmergencyWithdrawal walletClient={walletClient} onEmergencyWithdraw={handleEmergencyWithdraw} />
            <StakePositions account={address} walletClient={walletClient} />
          </div>
        )}

        {!isClient && (
          <div className="text-center py-12">
            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

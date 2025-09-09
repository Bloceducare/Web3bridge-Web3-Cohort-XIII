import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Hooks
import { useContractEventListener } from "./hooks/useContractEventListener.js";

// Components
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import Header from "./components/Header.jsx";
import StakingCard from "./components/StakingCard.jsx";
import WithdrawalCard from "./components/WithdrawalCard.jsx";
import RewardsCard from "./components/RewardsCard.jsx";
import UserPositionCard from "./components/UserPositionCard.jsx";
import ProtocolStatsCard from "./components/ProtocolStatsCard.jsx";
import EmergencyWithdrawCard from "./components/EmergencyWithdrawCard.jsx";

// Styles
import "@rainbow-me/rainbowkit/styles.css";

function App() {
  // Setup contract event listeners for transaction history
  useContractEventListener();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* First Row - User Position */}
            <div className="lg:col-span-1">
              <UserPositionCard />
            </div>

            {/* Protocol Stats Card - More space on larger screens */}
            <div className="lg:col-span-2">
              <ProtocolStatsCard />
            </div>

            {/* Action Cards Row */}
            <div className="lg:col-span-1">
              <StakingCard />
            </div>

            <div className="lg:col-span-1">
              <WithdrawalCard />
            </div>

            <div className="lg:col-span-1">
              <RewardsCard />
            </div>

            {/* Emergency Withdraw Card - Full width */}
            <div className="lg:col-span-3">
              <EmergencyWithdrawCard />
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;

import React from 'react';
import { Web3Provider } from './context/Web3Context';
import Header from './components/Header';
import ProtocolStats from './components/ProtocolStats';
import StakingForm from './components/StakingForm';
import UserStakes from './components/UserStakes';
import RewardsSection from './components/RewardsSection';
import MintTokens from './components/MintTokens';
import './index.css';

function App() {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Protocol Statistics */}
          <ProtocolStats />
          
          {/* Mint Tokens Banner - Show at top for easy access */}
          <div className="mb-8">
            <MintTokens />
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div className="space-y-8">
              <StakingForm />
              <RewardsSection />
            </div>
            
            {/* Right Column */}
            <div>
              <UserStakes />
            </div>
          </div>
          
          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm mt-12 pt-8 border-t">
            <p>
              Built by Ye! | 
              <a 
                href="https://sepolia.etherscan.io/address/0x21d92A7cA177d4bCCB5455003E15F340075A2653" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 ml-1"
              >
                View Contract on Etherscan
              </a>
            </p>
          </footer>
        </main>
      </div>
    </Web3Provider>
  );
}

export default App;
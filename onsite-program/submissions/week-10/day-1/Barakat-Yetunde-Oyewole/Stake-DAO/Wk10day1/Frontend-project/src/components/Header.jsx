import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWeb3 } from '../context/Web3Context';

/**
 * Header component - Top navigation bar with logo, menu, and wallet connection
 * Uses RainbowKit's ConnectButton for beautiful wallet connection experience
 */
const Header = () => {
  const { isCorrectChain } = useWeb3();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary-600">
                 StakeDAO
              </h1>
            </div>
          </div>

          {/* Navigation Menu - Hidden on mobile, shown on medium+ screens */}
          <nav className="hidden md:flex space-x-8">
            {/* These are anchor links that scroll to sections on the page */}
            <a href="#stake" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
              Stake
            </a>
            <a href="#withdraw" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
              Withdraw
            </a>
            <a href="#rewards" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
              Rewards
            </a>
          </nav>

          {/* Wallet Connection Section */}
          <div className="flex items-center space-x-4">
            
            {/* Show warning if user is on wrong network */}
            {!isCorrectChain && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Wrong Network
              </div>
            )}
            
            {/* 
              RainbowKit ConnectButton - This handles everything:
              - Shows "Connect Wallet" when disconnected
              - Shows account info when connected
              - Provides dropdown with network switching and disconnect
              - Beautiful modal with multiple wallet options
            */}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
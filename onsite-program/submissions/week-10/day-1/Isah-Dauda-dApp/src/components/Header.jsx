import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { formatAddress } from "../utils/formatters.js";

const Header = () => {
  const { address, isConnected } = useAccount();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Staking dApp</h1>
            
          </div>

          <div className="flex items-center gap-4">
            <div className="ml-4 px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs font-medium text-magenta-600">Sepolia</span>
            </div>
            {isConnected && address && (
              <div className="hidden sm:block text-sm text-gray-600">
                Connected: {formatAddress(address)}
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaRocket } from 'react-icons/fa';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary-pink to-primary-blue rounded-lg">
              <FaRocket className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">STK Staking</h1>
              <p className="text-xs text-gray-600">Stake • Earn • Grow</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sepolia Testnet</span>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, LogOut, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';

export function WalletConnector() {
  const {
    isConnecting,
    isConnected,
    address,
    error,
    availableWallets,
    connect,
    connectLegacy,
    disconnect,
  } = useWallet();

  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Handle connect button click
  const handleConnectClick = () => {
    if (availableWallets.length > 0) {
      setShowWalletOptions(true);
    } else {
      // If no EIP-6963 wallets are available, try legacy connection
      connectLegacy().catch(console.error);
    }
  };

  // If connected, show address and disconnect option
  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {formatAddress(address)}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={disconnect} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If connecting, show loading state
  if (isConnecting) {
    return (
      <Button disabled>
        <span className="animate-pulse">Connecting...</span>
      </Button>
    );
  }

  // If not connected and showing wallet options
  if (showWalletOptions) {
    return (
      <Card className="p-4 w-64">
        <h3 className="text-lg font-medium mb-3">Connect Wallet</h3>
        {availableWallets.length > 0 ? (
          <div className="space-y-2">
            {availableWallets.map((wallet) => (
              <Button
                key={wallet.uuid}
                variant="outline"
                className="w-full justify-start"
                onClick={() => connect(wallet)}
              >
                {wallet.icon && (
                  <img 
                    src={wallet.icon} 
                    alt={`${wallet.name} icon`} 
                    className="h-5 w-5 mr-2" 
                    onError={(e) => {
                      // If image fails to load, replace with a default icon
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                )}
                {wallet.name}
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">No compatible wallets found</p>
            <Button 
              variant="outline" 
              className="mt-2 w-full"
              onClick={() => connectLegacy()}
            >
              Try Legacy Connection
            </Button>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full mt-2"
          onClick={() => setShowWalletOptions(false)}
        >
          Cancel
        </Button>
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-600 rounded-md flex items-center text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </Card>
    );
  }

  // Default state - show connect button
  return (
    <Button onClick={handleConnectClick}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
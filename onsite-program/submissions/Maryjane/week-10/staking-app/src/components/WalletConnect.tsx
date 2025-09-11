'use client';

interface WalletConnectProps {
  account: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletConnect({ account, onConnect, onDisconnect }: WalletConnectProps) {
  const isMetaMaskAvailable = typeof window !== 'undefined' && window.ethereum;

  return (
    <div className="p-4">
      {account ? (
        <div>
          <p>Connected: {account}</p>
          <button onClick={onDisconnect} className="bg-red-500 text-white px-4 py-2 rounded">
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          {!isMetaMaskAvailable && (
            <p className="text-red-500 mb-2">MetaMask not detected. Please install MetaMask extension.</p>
          )}
          <button
            onClick={onConnect}
            disabled={!isMetaMaskAvailable}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
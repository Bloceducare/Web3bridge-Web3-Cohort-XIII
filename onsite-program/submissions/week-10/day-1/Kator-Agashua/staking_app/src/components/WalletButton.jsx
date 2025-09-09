import { useState, useEffect } from 'react';
import WalletConnection from './WalletConnection';

const WalletButton = () => {
  const {
    account,
    isConnected,
    error,
    connectWallet,
    disconnectWallet
  } = WalletConnection();

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="wallet-button-container">
      {error && <div className="error-message">{error}</div>}
      
      {isConnected ? (
        <div className="wallet-info">
          <span className="wallet-address">{formatAddress(account)}</span>
          <button className="disconnect-button" onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      ) : (
        <button className="connect-button" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletButton;
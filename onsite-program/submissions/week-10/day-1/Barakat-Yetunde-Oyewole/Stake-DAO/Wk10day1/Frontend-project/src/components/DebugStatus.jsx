import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useContracts, useStakingData } from '../hooks/useContracts';
import { formatTokenAmount } from '../utils';

/**
 * DebugStatus - Shows current contract and connection status
 */
const DebugStatus = () => {
  const { account, isConnected, chainId, provider, signer } = useWeb3();
  const { stakingContract, tokenContract } = useContracts();
  const { tokenBalance, loading } = useStakingData();

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4 text-sm">
      <h4 className="font-semibold mb-2"> Debug Status</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p><strong>Wallet:</strong> {isConnected ? ' Connected' : ' Disconnected'}</p>
          <p><strong>Account:</strong> {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'None'}</p>
          <p><strong>Chain ID:</strong> {chainId}</p>
          <p><strong>Provider:</strong> {provider ? ' Available' : ' Missing'}</p>
          <p><strong>Signer:</strong> {signer ? ' Available' : ' Missing'}</p>
        </div>
        <div>
          <p><strong>Staking Contract:</strong> {stakingContract ? ' Connected' : ' Missing'}</p>
          <p><strong>Token Contract:</strong> {tokenContract ? ' Connected' : ' Missing'}</p>
          <p><strong>Token Balance:</strong> {formatTokenAmount(tokenBalance)} MTK</p>
          <p><strong>Loading:</strong> {loading ? ' Yes' : ' No'}</p>
          <p><strong>Balance BigInt:</strong> {tokenBalance.toString()}</p>
        </div>
      </div>
    </div>
  );
};

export default DebugStatus;

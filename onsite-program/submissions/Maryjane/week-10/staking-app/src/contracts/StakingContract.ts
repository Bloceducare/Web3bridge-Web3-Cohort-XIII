import { getContract, WalletClient } from 'viem';
import { STAKING_ABI } from '@/config/abi';
import { CONTRACT_ADDRESSES } from '@/config/constants';

// Re-export ABI and addresses for easy access
export { STAKING_ABI } from '@/config/abi';
export { CONTRACT_ADDRESSES } from '@/config/constants';

// Export contract address for convenience
export const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.STAKING_CONTRACT;

export function getStakingContract(walletClient: WalletClient) {
  return getContract({
    address: CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    client: walletClient,
  });
}
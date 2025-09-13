import { formatEther } from 'viem';

export function formatTokenAmount(amount: bigint | string, decimals = 4): string {
  if (typeof amount === 'string') {
    return parseFloat(amount).toFixed(decimals);
  }
  return parseFloat(formatEther(amount)).toFixed(decimals);
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Unlocked';
  
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatApr(apr: string): string {
  return `${parseFloat(apr).toFixed(2)}%`;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
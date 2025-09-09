// Import formatting functions from ethers library
import { ethers } from 'ethers';

/**
 * Format a big integer token amount into a human-readable string
 * Example: 1000000000000000000n (1 token with 18 decimals) becomes "1"
 * 
 * @param {bigint} amount - The token amount in smallest unit (wei)
 * @param {number} decimals - Number of decimal places (usually 18 for ERC20)
 * @param {number} precision - How many decimal places to show in output
 */
export function formatTokenAmount(amount, decimals = 18, precision = 4) {
  // Convert from wei/smallest unit to human readable (like 1000000000000000000 to 1.0)
  const formatted = ethers.formatUnits(amount, decimals);
  
  // Convert to regular JavaScript number for formatting
  const num = parseFloat(formatted);
  
  // Format with nice comma separators and limited decimal places
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

/**
 * Convert a human-readable string amount to big integer for blockchain
 * Example: "1.5" becomes 1500000000000000000n (with 18 decimals)
 * 
 * @param {string} amount - Human readable amount like "1.5"
 * @param {number} decimals - Number of decimal places (usually 18)
 */
export function parseTokenAmount(amount, decimals = 18) {
  try {
    // Convert user input like "1.5" to blockchain format like 1500000000000000000n
    return ethers.parseUnits(amount.toString(), decimals);
  } catch {
    // If conversion fails (invalid input), return 0
    return 0n;
  }
}

/**
 * Calculate how much time is left until a stake unlocks
 * Takes a timestamp and returns a human-readable string
 * 
 * @param {bigint} unlockTime - Unix timestamp when stake unlocks
 */
export function formatTimeRemaining(unlockTime) {
  // Get current time in seconds
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  // Calculate seconds until unlock
  const timeLeft = unlockTime - now;
  
  // If time is up, stake is unlocked
  if (timeLeft <= 0n) {
    return 'Unlocked';
  }
  
  // Convert to regular number for easier math
  const seconds = Number(timeLeft);
  
  // Calculate days, hours, minutes
  const days = Math.floor(seconds / 86400); // 86400 seconds in a day
  const hours = Math.floor((seconds % 86400) / 3600); // 3600 seconds in an hour
  const minutes = Math.floor((seconds % 3600) / 60); // 60 seconds in a minute
  
  // Return most appropriate time format
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Convert reward rate from basis points to percentage
 * Example: 250 basis points becomes 2.5%
 * 
 * @param {bigint} rewardRate - Rate in basis points from contract
 */
export function calculateAPR(rewardRate) {
  // Convert basis points to percentage
  // rewardRate is in basis points (250 = 2.5%)
  return Number(rewardRate) / 100;
}

/**
 * Check if a stake is currently unlocked (past its lock duration)
 * 
 * @param {Object} stake - Stake object with timestamp and lockDuration
 */
export function isStakeUnlocked(stake) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const unlockTime = stake.timestamp + stake.lockDuration;
  return now >= unlockTime;
}

/**
 * Get the exact timestamp when a stake will unlock
 * 
 * @param {Object} stake - Stake object with timestamp and lockDuration
 */
export function getUnlockTime(stake) {
  return stake.timestamp + stake.lockDuration;
}

/**
 * Shorten an Ethereum address for display
 * Example: "0x1234...5678"
 * 
 * @param {string} address - Full Ethereum address
 */
export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Utility function to combine CSS classes
 * Filters out falsy values and joins with spaces
 * 
 * @param {...(string|undefined|false)} classes - CSS class names
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
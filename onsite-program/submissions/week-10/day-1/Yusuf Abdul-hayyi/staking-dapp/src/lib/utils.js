import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAddress, formatUnits } from "viem";

/**
 * Merge Tailwind + conditional classes.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Shortens an Ethereum/Solana address for UI display.
 * Example: 0x1234...abcd
 */
export const shortenAddress = (address, length = 4) => {
  if (!isAddress(address)) return "";
  return `${address.slice(0, length + 2)}...${address.slice(
    address.length - length
  )}`;
};

/**
 * Convert a BigInt token amount to a human-readable string.
 * @param {bigint|string|number} value 
 * @param {number} decimals 
 */
export const formatTokenAmount = (value, decimals = 18) => {
  try {
    return parseFloat(formatUnits(BigInt(value), decimals)).toFixed(4);
  } catch {
    return "0";
  }
};

/**
 * Format a timestamp into a human-readable date/time.
 */
export const formatUnlockDate = (timestamp) => {
  if (!timestamp) return "—";
  return new Date(Number(timestamp) * 1000).toLocaleString();
};

/**
 * Calculate APR into percentage string.
 */
export const formatApr = (apr) => {
  if (!apr) return "—";
  return `${apr}%`;
};

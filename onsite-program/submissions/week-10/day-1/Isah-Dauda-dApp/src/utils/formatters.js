import { formatUnits, parseUnits } from "viem";

/**
 * Format a token amount for display
 * @param {bigint} amount - The raw amount
 * @param {number} decimals - Token decimals (default 18)
 * @param {number} displayDecimals - Number of decimal places to show
 * @returns {string} Formatted amount
 */
export function formatTokenAmount(amount, decimals = 18, displayDecimals = 4) {
  if (!amount) return "0";
  const formatted = formatUnits(amount, decimals);
  return parseFloat(formatted).toFixed(displayDecimals);
}

/**
 * Parse a token amount from user input
 * @param {string} amount - The amount string
 * @param {number} decimals - Token decimals (default 18)
 * @returns {bigint} Parsed amount
 */
export function parseTokenAmount(amount, decimals = 18) {
  if (!amount || amount === "") return BigInt(0);
  return parseUnits(amount, decimals);
}

/**
 * Format an address for display (truncated)
 * @param {string} address - The address to format
 * @param {number} chars - Number of chars to show on each side
 * @returns {string} Formatted address
 */
export function formatAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(
    address.length - chars
  )}`;
}

/**
 * Format a percentage value
 * @param {number} value - The percentage value (e.g., 250 for 2.5%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 2) {
  if (!value) return "0%";
  return `${(value / 100).toFixed(decimals)}%`;
}

/**
 * Format APR from basis points
 * @param {bigint} basisPoints - APR in basis points
 * @returns {string} Formatted APR percentage
 */
export function formatAPR(basisPoints) {
  if (!basisPoints) return "0%";
  const percentage = Number(basisPoints) / 100;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Calculate the emergency withdrawal amount after penalty
 * @param {bigint} stakedAmount - The staked amount
 * @param {number} penalty - Penalty percentage (default 50)
 * @returns {bigint} Amount after penalty
 */
export function calculateEmergencyAmount(stakedAmount, penalty = 50) {
  if (!stakedAmount) return BigInt(0);
  const penaltyAmount = (stakedAmount * BigInt(penalty)) / BigInt(100);
  return stakedAmount - penaltyAmount;
}

/**
 * Check if a value is a valid number string
 * @param {string} value - The value to check
 * @returns {boolean} Whether the value is valid
 */
export function isValidNumber(value) {
  if (!value || value === "") return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Truncate a number to specified decimal places without rounding
 * @param {string} value - The value to truncate
 * @param {number} decimals - Number of decimal places
 * @returns {string} Truncated value
 */
export function truncateDecimals(value, decimals = 4) {
  if (!value || value === "") return "";
  const parts = value.split(".");
  if (parts.length === 1) return value;
  return `${parts[0]}.${parts[1].substring(0, decimals)}`;
}

/**
 * Format a timestamp for display
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date and time
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format a number with commas for better readability
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {string} Formatted number string
 */
export function formatNumber(num, decimals = 2) {
  if (!num || num === 0) return "0";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

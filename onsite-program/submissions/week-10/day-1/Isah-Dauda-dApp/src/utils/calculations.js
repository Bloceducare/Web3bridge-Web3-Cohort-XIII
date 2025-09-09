import { PROTOCOL_CONFIG } from "./constants.js";

/**
 * Calculate APR based on total staked amount
 * @param {bigint} totalStaked - Total amount staked in the protocol
 * @returns {number} APR percentage
 */
export function calculateCurrentAPR(totalStaked) {
  const initialAPR = PROTOCOL_CONFIG.INITIAL_APR; // 250%
  const reductionPerThousand = PROTOCOL_CONFIG.APR_REDUCTION; // 0.5% reduction per 1000 tokens
  const minimumAPR = PROTOCOL_CONFIG.MINIMUM_APR; // 10%

  if (!totalStaked) return initialAPR;

  // Convert to token units (assuming 18 decimals)
  const stakedTokens = Number(totalStaked) / Math.pow(10, 18);
  const thousands = Math.floor(stakedTokens / 1000);
  const reduction = thousands * reductionPerThousand;

  return Math.max(initialAPR - reduction, minimumAPR); // Minimum 10% APR
}

/**
 * Calculate pending rewards for a user
 * @param {bigint} stakedAmount - User's staked amount
 * @param {number} lastStakeTimestamp - Timestamp of last stake
 * @param {number} currentAPR - Current APR percentage
 * @returns {bigint} Pending rewards amount
 */
export function calculatePendingRewards(
  stakedAmount,
  lastStakeTimestamp,
  currentAPR
) {
  if (!stakedAmount || !lastStakeTimestamp || !currentAPR) return BigInt(0);

  const currentTime = Math.floor(Date.now() / 1000);
  const stakingDuration = currentTime - lastStakeTimestamp;

  if (stakingDuration <= 0) return BigInt(0);

  // Calculate rewards every 10 seconds
  const rewardIntervals = Math.floor(
    stakingDuration / PROTOCOL_CONFIG.REWARD_INTERVAL
  );

  if (rewardIntervals <= 0) return BigInt(0);

  // Calculate yearly rewards based on APR percentage
  const yearlyRewards =
    (stakedAmount * BigInt(Math.floor(currentAPR * 100))) / BigInt(10000);

  // Calculate rewards based on 10-second intervals
  const secondsPerYear = 365 * 24 * 60 * 60;
  const totalDuration = rewardIntervals * PROTOCOL_CONFIG.REWARD_INTERVAL;
  const rewards =
    (yearlyRewards * BigInt(totalDuration)) / BigInt(secondsPerYear);

  return rewards;
}

/**
 * Calculate time until unlock
 * @param {number} lastStakeTimestamp - Timestamp of last stake
 * @returns {number} Seconds until unlock (0 if already unlocked)
 */
export function calculateTimeUntilUnlock(lastStakeTimestamp) {
  if (!lastStakeTimestamp) return 0;

  const currentTime = Math.floor(Date.now() / 1000);
  const unlockTime = lastStakeTimestamp + PROTOCOL_CONFIG.MIN_LOCK_DURATION;
  const timeUntilUnlock = unlockTime - currentTime;

  return Math.max(timeUntilUnlock, 0);
}

/**
 * Check if user can withdraw (lock period has passed)
 * @param {number} lastStakeTimestamp - Timestamp of last stake
 * @returns {boolean} Whether user can withdraw
 */
export function canWithdraw(lastStakeTimestamp) {
  return calculateTimeUntilUnlock(lastStakeTimestamp) === 0;
}

/**
 * Format time duration in human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (seconds <= 0) return "Available now";

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Calculate total value locked (TVL) in USD
 * @param {bigint} totalStaked - Total staked amount
 * @param {number} tokenPrice - Token price in USD
 * @returns {number} TVL in USD
 */
export function calculateTVL(totalStaked, tokenPrice = 0) {
  if (!totalStaked || !tokenPrice) return 0;
  const tokens = Number(totalStaked) / Math.pow(10, 18);
  return tokens * tokenPrice;
}

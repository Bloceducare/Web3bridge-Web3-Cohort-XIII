export interface UserDetails {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  pendingRewards: bigint;
  timeUntilUnlock: bigint;
  canWithdraw: boolean;
}

export interface UserInfo {
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  rewardDebt: bigint;
  pendingRewards: bigint;
}

export interface ProtocolStats {
  totalStaked: string;
  currentRewardRate: string;
  initialApr: string;
  minLockDuration: string;
}

export interface UserData {
  stakedAmount: string;
  pendingRewards: string;
  timeUntilUnlock: number;
  canWithdraw: boolean;
  tokenBalance: string;
  allowance: string;
}
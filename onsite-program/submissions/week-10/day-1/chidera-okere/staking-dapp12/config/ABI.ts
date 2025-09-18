// ABI definitions for the staking dApp

export const STAKING_ABI = [
  "function stake(uint256 _amount) external",
  "function withdraw(uint256 _amount) external",
  "function claimRewards() external",
  "function emergencyWithdraw() external",
  "function getUserDetails(address _user) external view returns (tuple(uint256 stakedAmount, uint256 lastStakeTimestamp, uint256 pendingRewards, uint256 timeUntilUnlock, bool canWithdraw))",
  "function getPendingRewards(address _user) external view returns (uint256)",
  "function getTimeUntilUnlock(address _user) external view returns (uint256)",
  "function totalStaked() external view returns (uint256)",
  "function currentRewardRate() external view returns (uint256)",
  "function stakingToken() external view returns (address)",
  "function initialApr() external view returns (uint256)",
  "function minLockDuration() external view returns (uint256)",
  "function emergencyWithdrawPenalty() external view returns (uint256)",
  "function getTotalRewards() external view returns (uint256)",
];

export const TOKEN_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function mint(address to, uint256 amount) external",
];

// Contract addresses
export const STAKING_CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
export const TOKEN_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
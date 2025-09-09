import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'viem/chains';

// Contract addresses
export const STAKE_TOKEN_ADDRESS = "0x7c37ca51E4e649A620E0BF2Fc67Fe5f57E6AB117" as const;
export const STAKING_CONTRACT_ADDRESS = "0x37c9a4d8193A2F67C7eDa8a18136E9856cE4010a" as const;

// Chain configuration
export const CHAIN_ID = 11155111; // Sepolia

// Wagmi config
export const config = getDefaultConfig({
  appName: 'Staking DApp',
  projectId: 'PROJECT_ID_HERE', 
  chains: [sepolia],
  ssr: false,
});

// Contract configurations
export const STAKING_CONTRACT_CONFIG = {
  address: STAKING_CONTRACT_ADDRESS,
  abi: [
    // Core functions
    {
      inputs: [{ name: "_amount", type: "uint256" }],
      name: "stake",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "_amount", type: "uint256" }],
      name: "withdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "claimRewards",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "emergencyWithdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    // View functions
    {
      inputs: [{ name: "_user", type: "address" }],
      name: "getUserDetails",
      outputs: [
        {
          components: [
            { name: "stakedAmount", type: "uint256" },
            { name: "lastStakeTimestamp", type: "uint256" },
            { name: "pendingRewards", type: "uint256" },
            { name: "timeUntilUnlock", type: "uint256" },
            { name: "canWithdraw", type: "bool" },
          ],
          name: "",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "_user", type: "address" }],
      name: "getPendingRewards",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "_user", type: "address" }],
      name: "getTimeUntilUnlock",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalStaked",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "currentRewardRate",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "stakingToken",
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "", type: "address" }],
      name: "userInfo",
      outputs: [
        { name: "stakedAmount", type: "uint256" },
        { name: "lastStakeTimestamp", type: "uint256" },
        { name: "rewardDebt", type: "uint256" },
        { name: "pendingRewards", type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
    // Events
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "user", type: "address" },
        { indexed: false, name: "amount", type: "uint256" },
        { indexed: false, name: "timestamp", type: "uint256" },
        { indexed: false, name: "newTotalStaked", type: "uint256" },
        { indexed: false, name: "currentRewardRate", type: "uint256" },
      ],
      name: "Staked",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "user", type: "address" },
        { indexed: false, name: "amount", type: "uint256" },
        { indexed: false, name: "timestamp", type: "uint256" },
        { indexed: false, name: "newTotalStaked", type: "uint256" },
        { indexed: false, name: "currentRewardRate", type: "uint256" },
        { indexed: false, name: "rewardsAccrued", type: "uint256" },
      ],
      name: "Withdrawn",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "user", type: "address" },
        { indexed: false, name: "amount", type: "uint256" },
        { indexed: false, name: "timestamp", type: "uint256" },
        { indexed: false, name: "newPendingRewards", type: "uint256" },
        { indexed: false, name: "totalStaked", type: "uint256" },
      ],
      name: "RewardsClaimed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "user", type: "address" },
        { indexed: false, name: "amount", type: "uint256" },
        { indexed: false, name: "penalty", type: "uint256" },
        { indexed: false, name: "timestamp", type: "uint256" },
        { indexed: false, name: "newTotalStaked", type: "uint256" },
      ],
      name: "EmergencyWithdrawn",
      type: "event",
    },
  ],
} as const;

export const STAKE_TOKEN_CONFIG = {
  address: STAKE_TOKEN_ADDRESS,
  abi: [
    // ERC20 functions
    {
      inputs: [{ name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    // Events
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "from", type: "address" },
        { indexed: true, name: "to", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "owner", type: "address" },
        { indexed: true, name: "spender", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
      name: "Approval",
      type: "event",
    },
  ],
} as const;

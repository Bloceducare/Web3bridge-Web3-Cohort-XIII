"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import {
  STAKING_CONTRACT_ADDRESS,
  STAKING_CONTRACT_ABI,
  ERC20_ABI,
  STAKING_TOKEN_ADDRESS,
} from "@/lib/contract";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface UserStakeInfo {
  stakedAmount: string;
  lastStakeTimestamp: number;
  pendingRewards: string;
  timeUntilUnlock: number;
  canWithdraw: boolean;
}

export interface ProtocolStats {
  totalStaked: string;
  currentRewardRate: string;
  totalRewards: string;
  isPaused: boolean;
}

export interface TokenInfo {
  balance: string;
  allowance: string;
  symbol: string;
  name: string;
  decimals: number;
}

export function useWeb3() {
  const { address: account, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [stakingContract, setStakingContract] =
    useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(
    null
  );

  const validateContractDeployment = async (
    address: string,
    contractName: string,
    web3Provider: ethers.BrowserProvider
  ) => {
    try {
      console.log(`[v0] Validating ${contractName} at ${address}...`);

      // Check if contract exists
      const code = await web3Provider.getCode(address);
      if (code === "0x") {
        console.error(`[v0] ❌ ${contractName} NOT DEPLOYED at ${address}`);
        console.error(`[v0] 📋 Troubleshooting checklist:`);
        console.error(
          `[v0] 1. Verify contract is deployed on Sepolia testnet (current chainId: ${chainId})`
        );
        console.error(`[v0] 2. Check contract address in .env.local file`);
        console.error(`[v0] 3. Confirm you're connected to Sepolia network`);
        console.error(
          `[v0] 4. Visit https://sepolia.etherscan.io/address/${address} to verify deployment`
        );
        return false;
      }

      // Get contract creation info
      const network = await web3Provider.getNetwork();
      console.log(`[v0] ✅ ${contractName} found at ${address}`);
      console.log(
        `[v0] 📊 Network: ${network.name} (chainId: ${network.chainId})`
      );
      console.log(
        `[v0] 📏 Contract bytecode size: ${(code.length - 2) / 2} bytes`
      );

      return true;
    } catch (error) {
      console.error(`[v0] ❌ Failed to validate ${contractName}:`, error);
      return false;
    }
  };

  const testContractFunctions = async (
    staking: ethers.Contract,
    token: ethers.Contract
  ) => {
    console.log("[v0] 🧪 Testing contract functions...");

    const tests = [
      {
        name: "Staking Contract - totalStaked()",
        test: async () => {
          const result = await staking.totalStaked();
          console.log(
            "[v0] ✅ totalStaked:",
            ethers.formatEther(result),
            "tokens"
          );
          return result;
        },
      },
      {
        name: "Staking Contract - currentRewardRate()",
        test: async () => {
          const result = await staking.currentRewardRate();
          console.log("[v0] ✅ currentRewardRate:", result.toString(), "%");
          return result;
        },
      },
      {
        name: "Staking Contract - paused()",
        test: async () => {
          const result = await staking.paused();
          console.log("[v0] ✅ Contract paused status:", result);
          if (result) {
            console.warn("[v0] ⚠️  WARNING: Staking contract is PAUSED!");
          }
          return result;
        },
      },
      {
        name: "Token Contract - symbol()",
        test: async () => {
          const result = await token.symbol();
          console.log("[v0] ✅ Token symbol:", result);
          return result;
        },
      },
      {
        name: "Token Contract - name()",
        test: async () => {
          const result = await token.name();
          console.log("[v0] ✅ Token name:", result);
          return result;
        },
      },
      {
        name: "Token Contract - decimals()",
        test: async () => {
          const result = await token.decimals();
          console.log("[v0] ✅ Token decimals:", result);
          return result;
        },
      },
    ];

    let passedTests = 0;
    for (const { name, test } of tests) {
      try {
        await test();
        passedTests++;
      } catch (error) {
        console.error(`[v0] ❌ ${name} FAILED:`, error);
        console.error(`[v0] 💡 This suggests:`);
        console.error(`[v0] - Function doesn't exist in deployed contract`);
        console.error(`[v0] - ABI mismatch with deployed contract`);
        console.error(`[v0] - Contract has different function signatures`);
      }
    }

    console.log(
      `[v0] 📊 Contract function tests: ${passedTests}/${tests.length} passed`
    );

    if (passedTests === 0) {
      console.error("[v0] 🚨 CRITICAL: No contract functions are working!");
      console.error("[v0] 💡 Possible solutions:");
      console.error("[v0] 1. Verify ABI matches your deployed contract");
      console.error(
        "[v0] 2. Check if you deployed a different version of the contract"
      );
      console.error(
        "[v0] 3. Ensure contract constructor completed successfully"
      );
    } else if (passedTests < tests.length) {
      console.warn(
        "[v0] ⚠️  Some contract functions failed - partial ABI mismatch"
      );
    } else {
      console.log("[v0] 🎉 All contract functions working correctly!");
    }

    return passedTests === tests.length;
  };

  // Initialize provider and contracts when wallet is connected
  useEffect(() => {
    if (
      isConnected &&
      walletClient &&
      typeof window !== "undefined" &&
      window.ethereum
    ) {
      console.log("[v0] 🚀 Initializing Web3...");
      console.log("[v0] 🔗 Connected chainId:", chainId);
      console.log("[v0] 🎯 Expected chainId for Sepolia:", 11155111);
      console.log("[v0] 📍 Contract addresses:", {
        STAKING_CONTRACT_ADDRESS,
        STAKING_TOKEN_ADDRESS,
      });

      if (chainId !== 11155111) {
        console.error(`[v0] ❌ NETWORK MISMATCH!`);
        console.error(`[v0] Connected to chainId: ${chainId}`);
        console.error(`[v0] Expected chainId: 11155111 (Sepolia)`);
        console.error(
          `[v0] 🔄 Please switch to Sepolia testnet in your wallet`
        );
        return;
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      web3Provider.getSigner().then(async (web3Signer) => {
        setSigner(web3Signer);

        // Validate contract deployments
        const stakingValid = await validateContractDeployment(
          STAKING_CONTRACT_ADDRESS,
          "Staking Contract",
          web3Provider
        );
        const tokenValid = await validateContractDeployment(
          STAKING_TOKEN_ADDRESS,
          "Token Contract",
          web3Provider
        );

        if (!stakingValid || !tokenValid) {
          console.error("[v0] 🚨 Contract validation failed!");
          console.error("[v0] 📋 Next steps:");
          console.error("[v0] 1. Deploy contracts to Sepolia testnet");
          console.error("[v0] 2. Update .env.local with correct addresses");
          console.error("[v0] 3. Restart the development server");
          return;
        }

        // Initialize contracts
        const staking = new ethers.Contract(
          STAKING_CONTRACT_ADDRESS,
          STAKING_CONTRACT_ABI,
          web3Signer
        );
        const token = new ethers.Contract(
          STAKING_TOKEN_ADDRESS,
          ERC20_ABI,
          web3Signer
        );

        // Test contract functions
        const functionsWorking = await testContractFunctions(staking, token);

        if (functionsWorking) {
          console.log("[v0] 🎉 Web3 initialization complete!");
          setStakingContract(staking);
          setTokenContract(token);
        } else {
          console.error(
            "[v0] 🚨 Contract functions not working - initialization aborted"
          );
        }
      });
    } else {
      setProvider(null);
      setSigner(null);
      setStakingContract(null);
      setTokenContract(null);
    }
  }, [isConnected, walletClient, chainId]);

  // Get user stake information
  const getUserStakeInfo =
    useCallback(async (): Promise<UserStakeInfo | null> => {
      if (!stakingContract || !account) return null;

      try {
        console.log("[v0] Getting user stake info for:", account);
        const userDetails = await stakingContract.getUserDetails(account);
        console.log("[v0] User details retrieved successfully");
        return {
          stakedAmount: ethers.formatEther(userDetails.stakedAmount),
          lastStakeTimestamp: Number(userDetails.lastStakeTimestamp),
          pendingRewards: ethers.formatEther(userDetails.pendingRewards),
          timeUntilUnlock: Number(userDetails.timeUntilUnlock),
          canWithdraw: userDetails.canWithdraw,
        };
      } catch (error) {
        console.error("[v0] Failed to get user stake info:", error);
        return null;
      }
    }, [stakingContract, account]);

  // Get protocol statistics
  const getProtocolStats =
    useCallback(async (): Promise<ProtocolStats | null> => {
      if (!stakingContract) return null;

      try {
        console.log("[v0] Getting protocol stats...");
        const [totalStaked, currentRewardRate, totalRewards, isPaused] =
          await Promise.all([
            stakingContract.totalStaked(),
            stakingContract.currentRewardRate(),
            stakingContract.getTotalRewards(),
            stakingContract.paused(),
          ]);
        console.log("[v0] Protocol stats retrieved successfully");

        return {
          totalStaked: ethers.formatEther(totalStaked),
          currentRewardRate: currentRewardRate.toString(),
          totalRewards: ethers.formatEther(totalRewards),
          isPaused,
        };
      } catch (error) {
        console.error("[v0] Failed to get protocol stats:", error);
        return null;
      }
    }, [stakingContract]);

  // Get token information
  const getTokenInfo = useCallback(async (): Promise<TokenInfo | null> => {
    if (!tokenContract || !account) return null;

    try {
      console.log("[v0] Getting token info for:", account);
      const [balance, allowance, symbol, name, decimals] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.allowance(account, STAKING_CONTRACT_ADDRESS),
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
      ]);
      console.log("[v0] Token info retrieved successfully, symbol:", symbol);

      return {
        balance: ethers.formatEther(balance),
        allowance: ethers.formatEther(allowance),
        symbol,
        name,
        decimals: Number(decimals),
      };
    } catch (error) {
      console.error("[v0] Failed to get token info:", error);
      return null;
    }
  }, [tokenContract, account]);

  // Stake tokens
  const stake = useCallback(
    async (amount: string) => {
      if (!stakingContract || !tokenContract)
        throw new Error("Contracts not initialized");

      try {
        console.log("[v0] Starting stake process for amount:", amount);
        const amountWei = ethers.parseEther(amount);

        // Check allowance first
        console.log("[v0] Checking token allowance...");
        const allowance = await tokenContract.allowance(
          account,
          STAKING_CONTRACT_ADDRESS
        );
        console.log("[v0] Current allowance:", ethers.formatEther(allowance));

        if (allowance < amountWei) {
          console.log("[v0] Insufficient allowance, requesting approval...");
          const approveTx = await tokenContract.approve(
            STAKING_CONTRACT_ADDRESS,
            amountWei
          );
          console.log(
            "[v0] Approval transaction sent, waiting for confirmation..."
          );
          await approveTx.wait();
          console.log("[v0] Approval confirmed");
        }

        console.log("[v0] Sending stake transaction...");
        const tx = await stakingContract.stake(amountWei);
        console.log("[v0] Stake transaction sent, waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("[v0] Stake transaction confirmed");
        return receipt;
      } catch (error) {
        console.error("[v0] Stake failed:", error);
        throw error;
      }
    },
    [stakingContract, tokenContract, account]
  );

  // Withdraw tokens
  const withdraw = useCallback(
    async (amount: string) => {
      if (!stakingContract) throw new Error("Contract not initialized");

      const amountWei = ethers.parseEther(amount);
      const tx = await stakingContract.withdraw(amountWei);
      return await tx.wait();
    },
    [stakingContract]
  );

  // Emergency withdraw
  const emergencyWithdraw = useCallback(async () => {
    if (!stakingContract) throw new Error("Contract not initialized");

    const tx = await stakingContract.emergencyWithdraw();
    return await tx.wait();
  }, [stakingContract]);

  // Claim rewards
  const claimRewards = useCallback(async () => {
    if (!stakingContract) throw new Error("Contract not initialized");

    const tx = await stakingContract.claimRewards();
    return await tx.wait();
  }, [stakingContract]);

  return {
    account: account || "",
    provider,
    signer,
    stakingContract,
    tokenContract,
    isConnecting: false, // RainbowKit handles connection state
    chainId: chainId || 0,
    connectWallet: () => {}, // RainbowKit handles connection
    disconnectWallet: () => {}, // RainbowKit handles disconnection
    getUserStakeInfo,
    getProtocolStats,
    getTokenInfo,
    stake,
    withdraw,
    emergencyWithdraw,
    claimRewards,
    isConnected,
  };
}

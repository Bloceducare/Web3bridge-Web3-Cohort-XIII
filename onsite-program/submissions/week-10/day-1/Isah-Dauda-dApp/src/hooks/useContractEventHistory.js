import { useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useTransactionHistory } from "./useTransactionHistory.js";
import { STAKING_CONTRACT_ADDRESS } from "../utils/constants.js";
import { STAKING_ABI } from "../utils/abis.js";

/**
 * Hook to listen for contract events and automatically populate transaction history
 */
export function useContractEventHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { addTransaction } = useTransactionHistory();

  useEffect(() => {
    if (!address || !publicClient) return;

    let unsubscribe;

    const setupEventListeners = async () => {
      try {
        // Listen for Staked events
        const unsubscribeStaked = publicClient.watchContractEvent({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          eventName: "Staked",
          args: { user: address },
          onLogs: (logs) => {
            logs.forEach((log) => {
              const { user, amount } = log.args;
              if (user?.toLowerCase() === address?.toLowerCase()) {
                addTransaction({
                  type: "stake",
                  amount: amount,
                  hash: log.transactionHash,
                  blockNumber: log.blockNumber,
                  tokenSymbol: "TOKENS",
                });
              }
            });
          },
        });

        // Listen for Withdrawn events
        const unsubscribeWithdrawn = publicClient.watchContractEvent({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          eventName: "Withdrawn",
          args: { user: address },
          onLogs: (logs) => {
            logs.forEach((log) => {
              const { user, amount } = log.args;
              if (user?.toLowerCase() === address?.toLowerCase()) {
                addTransaction({
                  type: "withdraw",
                  amount: amount,
                  hash: log.transactionHash,
                  blockNumber: log.blockNumber,
                  tokenSymbol: "TOKENS",
                });
              }
            });
          },
        });

        // Listen for RewardClaimed events
        const unsubscribeRewardClaimed = publicClient.watchContractEvent({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          eventName: "RewardClaimed",
          args: { user: address },
          onLogs: (logs) => {
            logs.forEach((log) => {
              const { user, amount } = log.args;
              if (user?.toLowerCase() === address?.toLowerCase()) {
                addTransaction({
                  type: "claim",
                  amount: amount,
                  hash: log.transactionHash,
                  blockNumber: log.blockNumber,
                  tokenSymbol: "TOKENS",
                });
              }
            });
          },
        });

        // Listen for EmergencyWithdrawn events
        const unsubscribeEmergencyWithdrawn = publicClient.watchContractEvent({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          eventName: "EmergencyWithdrawn",
          args: { user: address },
          onLogs: (logs) => {
            logs.forEach((log) => {
              const { user, amount, penalty } = log.args;
              if (user?.toLowerCase() === address?.toLowerCase()) {
                addTransaction({
                  type: "emergency",
                  amount: amount,
                  penalty: penalty,
                  hash: log.transactionHash,
                  blockNumber: log.blockNumber,
                  tokenSymbol: "TOKENS",
                });
              }
            });
          },
        });

        // Cleanup function to unsubscribe from all events
        unsubscribe = () => {
          unsubscribeStaked?.();
          unsubscribeWithdrawn?.();
          unsubscribeRewardClaimed?.();
          unsubscribeEmergencyWithdrawn?.();
        };
      } catch (error) {
        console.error("Error setting up event listeners:", error);
      }
    };

    setupEventListeners();

    // Cleanup on unmount or address change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [address, publicClient, addTransaction]);

  return null; // This hook doesn't return any data, just sets up listeners
}

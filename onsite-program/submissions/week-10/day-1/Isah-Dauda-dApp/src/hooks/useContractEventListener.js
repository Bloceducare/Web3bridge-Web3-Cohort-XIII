import { useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useTransactionHistory } from "./useTransactionHistory.js";
import { STAKING_CONTRACT_ADDRESS } from "../utils/constants.js";
import { STAKING_ABI } from "../utils/abis.js";

/**
 * Hook to listen for contract events and automatically populate transaction history
 */
export function useContractEventListener() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { addTransaction, addToTotalRewards } = useTransactionHistory();

  useEffect(() => {
    if (!address || !publicClient) return;

    let unsubscribeStaked;
    let unsubscribeWithdrawn;
    let unsubscribeRewardsClaimed;
    let unsubscribeEmergencyWithdrawn;

    const setupEventListeners = async () => {
      try {
        // Listen for Staked events
        unsubscribeStaked = publicClient.watchContractEvent({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          eventName: "Staked",
          args: {
            user: address,
          },
          onLogs: (logs) => {
            logs.forEach((log) => {
              console.log("Staked event:", log);
              addTransaction({
                type: "stake",
                amount: log.args.amount,
                hash: log.transactionHash,
                blockNumber: Number(log.blockNumber),
                tokenSymbol: "TOKENS",
              });
            });
          },
        });

        // Listen for Withdrawn events
        unsubscribeWithdrawn = publicClient.watchContractEvent({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          eventName: "Withdrawn",
          args: {
            user: address,
          },
          onLogs: (logs) => {
            logs.forEach((log) => {
              console.log("Withdrawn event:", log);
              addTransaction({
                type: "withdraw",
                amount: log.args.amount,
                hash: log.transactionHash,
                blockNumber: Number(log.blockNumber),
                tokenSymbol: "TOKENS",
              });
            });
          },
        });

        // Listen for RewardsClaimed events
        unsubscribeRewardsClaimed = publicClient.watchContractEvent({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          eventName: "RewardsClaimed",
          args: {
            user: address,
          },
          onLogs: (logs) => {
            logs.forEach((log) => {
              console.log("RewardsClaimed event:", log);
              const rewardAmount = Number(log.args.amount) / 1e18; // Convert from wei
              addToTotalRewards(rewardAmount);
              addTransaction({
                type: "claim",
                amount: log.args.amount,
                hash: log.transactionHash,
                blockNumber: Number(log.blockNumber),
                tokenSymbol: "TOKENS",
              });
            });
          },
        });

        // Listen for EmergencyWithdrawn events
        unsubscribeEmergencyWithdrawn = publicClient.watchContractEvent({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          eventName: "EmergencyWithdrawn",
          args: {
            user: address,
          },
          onLogs: (logs) => {
            logs.forEach((log) => {
              console.log("EmergencyWithdrawn event:", log);
              addTransaction({
                type: "emergency",
                amount: log.args.amount,
                penalty: log.args.penalty,
                hash: log.transactionHash,
                blockNumber: Number(log.blockNumber),
                tokenSymbol: "TOKENS",
              });
            });
          },
        });

        console.log("Event listeners set up for address:", address);
      } catch (error) {
        console.error("Error setting up event listeners:", error);
      }
    };

    setupEventListeners();

    // Cleanup function
    return () => {
      unsubscribeStaked?.();
      unsubscribeWithdrawn?.();
      unsubscribeRewardsClaimed?.();
      unsubscribeEmergencyWithdrawn?.();
    };
  }, [address, publicClient, addTransaction, addToTotalRewards]);

  return null; // This hook doesn't return any data, just sets up listeners
}

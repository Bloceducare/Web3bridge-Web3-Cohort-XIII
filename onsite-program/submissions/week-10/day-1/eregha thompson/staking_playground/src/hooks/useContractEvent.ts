import { useWatchContractEvent, } from "wagmi";
import {
  STAKING_CONTRACT_ABI,
  STAKING_CONTRACT_ADDRESS,
} from "../config/contract";
import { QueryClient } from "@tanstack/react-query";

export function useStakingEvents() {
  const queryClient =new QueryClient(); // to refresh queries

  // When user stakes
  useWatchContractEvent({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    eventName: "Staked",
    onLogs(logs) {
      console.log("Staked event:", logs);
      queryClient.invalidateQueries(); // refetch all read hooks
    },
  });

  // When user withdraws
  useWatchContractEvent({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    eventName: "Withdrawn",
    onLogs(logs) {
      console.log("Withdrawn event:", logs);
      queryClient.invalidateQueries();
    },
  });

  // When user claims rewards
  useWatchContractEvent({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    eventName: "RewardsClaimed",
    onLogs(logs) {
      console.log("RewardsClaimed event:", logs);
      queryClient.invalidateQueries();
    },
  });

  // Emergency Withdraw
  useWatchContractEvent({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    eventName: "EmergencyWithdrawn",
    onLogs(logs) {
      console.log("EmergencyWithdrawn event:", logs);
      queryClient.invalidateQueries();
    },
  });

  // Reward Rate Updated
  useWatchContractEvent({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    eventName: "RewardRateUpdated",
    onLogs(logs) {
      console.log("RewardRateUpdated event:", logs);
      queryClient.invalidateQueries();
    },
  });
}

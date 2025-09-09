// hooks/useUserHistory.ts
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, formatEther } from "viem";
import { STAKING_CONTRACT_ADDRESS } from "../config/contract";

type HistoryItem = {
  type: "stake" | "withdraw";
  amount: string;
  txHash: string;
  timestamp: number;
};

export function useUserHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [history, setHistory] = useState<
    HistoryItem[]>([]);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchHistory = async () => {
      const stakedLogs = await publicClient.getLogs({
        address: STAKING_CONTRACT_ADDRESS,
        event: parseAbiItem("event Staked(address indexed user, uint256 amount)"),
        args: { user: address },
        fromBlock: 0n,
        toBlock: "latest",
      });

      const withdrawnLogs = await publicClient.getLogs({
        address: STAKING_CONTRACT_ADDRESS,
        event: parseAbiItem("event Withdrawn(address indexed user, uint256 amount)"),
        args: { user: address },
        fromBlock: 0n,
        toBlock: "latest",
      });

      // Combine & sort by block timestamp
      const combined = await Promise.all(
        [...stakedLogs, ...withdrawnLogs].map(async (log) => {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          return {
            type: log.eventName === "Staked" ? "stake" as const : "withdraw" as const,
            amount: formatEther(log.args.amount as bigint),
            txHash: log.transactionHash,
            timestamp: Number(block.timestamp),
          };
        })
      );

      setHistory(combined.sort((a, b) => b.timestamp - a.timestamp));
    };

    fetchHistory();
  }, [address, publicClient]);

  return history;
}

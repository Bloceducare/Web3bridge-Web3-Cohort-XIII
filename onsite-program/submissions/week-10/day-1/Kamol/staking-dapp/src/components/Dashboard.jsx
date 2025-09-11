import { useAccount, useReadContract } from "wagmi";
import { contractConfig } from "../lib/contract";
import React from "react";

export default function Dashboard() {
  const { address } = useAccount();

  const { data: totalStaked } = useReadContract({
    ...contractConfig,
    functionName: "totalStaked",
  });

  const { data: apr } = useReadContract({
    ...contractConfig,
    functionName: "currentRewardRate",
  });

  const { data: userDetails } = useReadContract({
    ...contractConfig,
    functionName: "getUserDetails",
    args: [address],
    enabled: !!address,
  });

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Protocol Stats</h2>
      <p>Total Staked: {totalStaked?.toString()}</p>
      <p>Current APR: {apr?.toString()}%</p>

      {address && userDetails && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Your Position</h2>
          <p>Staked: {userDetails.stakedAmount.toString()}</p>
          <p>Pending Rewards: {userDetails.pendingRewards.toString()}</p>
          <p>Unlock Time: {userDetails.timeUntilUnlock.toString()}s</p>
          <p>Can Withdraw: {userDetails.canWithdraw ? "Yes" : "No"}</p>
        </div>
      )}
    </div>
  );
}

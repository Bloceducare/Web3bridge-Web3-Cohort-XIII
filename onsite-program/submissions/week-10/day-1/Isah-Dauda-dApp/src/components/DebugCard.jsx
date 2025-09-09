import React from "react";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { STAKING_CONTRACT_ADDRESS } from "../utils/constants.js";
import { STAKING_ABI } from "../utils/abis.js";

const DebugCard = () => {
  const { address } = useAccount();

  // Read totalStaked
  const { data: totalStaked } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "totalStaked",
  });

  // Read currentRewardRate
  const { data: currentRewardRate } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "currentRewardRate",
  });

  // Read userInfo
  const { data: userInfo } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "userInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!address) return null;

  return (
    <div className="card bg-yellow-50 border-yellow-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🐛 Debug Info
      </h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Connected Address:</strong> {address}
        </div>
        <div>
          <strong>Contract:</strong> {STAKING_CONTRACT_ADDRESS}
        </div>
        <div>
          <strong>Total Staked:</strong>{" "}
          {totalStaked ? totalStaked.toString() : "null"}
        </div>
        <div>
          <strong>Current Reward Rate:</strong>{" "}
          {currentRewardRate ? currentRewardRate.toString() : "null"}
        </div>
        <div>
          <strong>User Info:</strong>{" "}
          {userInfo
            ? JSON.stringify(userInfo.map((v) => v.toString()))
            : "null"}
        </div>
      </div>
    </div>
  );
};

export default DebugCard;

"use client";

import useClaimRewards from "@/hooks/useClaimRewards";
import useEmergencyWithdraw from "@/hooks/useEmergencyWithdraw";
import { useGetHooks } from "@/hooks/useGetHooks";
import useStake from "@/hooks/useStake";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";


export default function Dashboard() {
  const { address } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const claimRewards = useClaimRewards();
  const [isClaiming, setIsClaiming] = useState(false);
  const emergencyWithdraw = useEmergencyWithdraw();
  const [isEmergencyWithdrawing, setIsEmergencyWithdrawing] = useState(false);
const hooksData = useGetHooks();
type UserInfo = {
  stakedAmount?: number;
  // add other properties if needed
};

const userInfo: UserInfo | undefined = hooksData?.userInfo as UserInfo | undefined;
const pendingRewards = hooksData?.pendingRewards;
const timeUntilUnlock = hooksData?.timeUntilUnlock;
const userDetails = hooksData?.userDetails;
const totalStaked = hooksData?.totalStaked;
const currentRewardRate = hooksData?.currentRewardRate;
const initialApr = hooksData?.initialApr;
const minLockDuration = hooksData?.minLockDuration;
  const stakeTokens = useStake();



  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsStaking(true);
    try {
      await stakeTokens(parseFloat(stakeAmount));
      setStakeAmount(""); // Clear input on success
    } catch (error) {
      console.error("Staking failed:", error);
    } finally {
      setIsStaking(false);
    }
  };

 const handleClaim = async () => {
   setIsClaiming(true);
   try {
     await claimRewards();
   } catch (error) {
     console.error("Claim failed:", error);
   } finally {
     setIsClaiming(false);
   }
 };
  
  const handleEmergencyWithdraw = async () => {
    setIsEmergencyWithdrawing(true);
    try {
      await emergencyWithdraw();
    } catch (error) {
      console.error("Emergency withdraw failed:", error);
    } finally {
      setIsEmergencyWithdrawing(false);
    }
  };

 return (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Staking Dashboard</h1>
      <Link
        href="/positions"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        View Positions
      </Link>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="p-4 border border-gray-300 rounded">
        <p className="text-sm text-gray-600">Current APR</p>
        <p className="text-xl font-semibold">
          {initialApr !== undefined ? `${initialApr}%` : 'Loading...'}
        </p>
      </div>
      <div className="p-4 border border-gray-300 rounded">
        <p className="text-sm text-gray-600">Total Staked</p>
        <p className="text-xl font-semibold">
          {totalStaked !== undefined && totalStaked !== null ? totalStaked.toLocaleString() : 'Loading...'}
        </p>
      </div>
      <div className="p-4 border border-gray-300 rounded">
        <p className="text-sm text-gray-600">Reward Rate</p>
        <p className="text-xl font-semibold">
          {currentRewardRate !== undefined ? `${currentRewardRate}%/day` : 'Loading...'}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-8">
      <div className="p-6 border border-gray-300 rounded">
        <h2 className="text-lg font-semibold mb-4">Stake Tokens</h2>
        <div className="space-y-4">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isStaking || !address}
          />
          <button
            onClick={handleStake}
            disabled={!address || isStaking || !stakeAmount}
            className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isStaking ? "Staking..." : "Stake"}
          </button>
        </div>
      </div>

      <div className="p-6 border border-gray-300 rounded">
        <h2 className="text-lg font-semibold mb-4">Your Position</h2>
        <div className="space-y-3">
          <p>
            Staked:{" "}
            <span className="font-semibold">
              {userInfo?.stakedAmount !== undefined 
                ? `${userInfo.stakedAmount.toLocaleString()} TOKENS`
                : 'Loading...'
              }
            </span>
          </p>
          <p>
            Pending Rewards:{" "}
            <span className="font-semibold text-green-600">
              {pendingRewards !== undefined && pendingRewards !== null
                ? `${pendingRewards.toLocaleString()} TOKENS`
                : 'Loading...'
              }
            </span>
          </p>
          <p>
            Unlock in:{" "}
            <span className="font-semibold">
              {timeUntilUnlock !== undefined && timeUntilUnlock !== null
                ? String(timeUntilUnlock)
                : 'Loading...'
              }
            </span>
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={handleClaim}
              disabled={!address || isClaiming || !pendingRewards || pendingRewards === 0}
              className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isClaiming ? "Claiming..." : "Claim Rewards"}
            </button>
            <button
              onClick={handleEmergencyWithdraw}
              disabled={!address || isEmergencyWithdrawing || !userInfo?.stakedAmount || userInfo.stakedAmount === 0}
              className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isEmergencyWithdrawing ? "Processing..." : "Emergency Withdraw"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
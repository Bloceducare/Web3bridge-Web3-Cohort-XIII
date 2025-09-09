import { useReadContracts, useAccount } from "wagmi";
import { contractAbi} from "../config/abi";
import { toast } from "sonner";
import React from 'react'

export const useGetHooks = () => {
    const { address } = useAccount();
    const contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as `0x${string}` | undefined;
   


    if (!address) {
        toast.error("Not Connected", {
            description: "Ode!, connect wallet"
        });
        return;
    }

    if (!contractAddress || !contractAddress.startsWith("0x")) {
        toast.error("Contract address not set or invalid", {
            description: "NEXT_STAKING_CONTRACT_ADDRESS is undefined or not a valid address"
        });
        throw new Error("NEXT_STAKING_CONTRACT_ADDRESS is undefined or not a valid address");
    }

      const { data } =  useReadContracts({
    contracts: [
      // User-specific data
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'userInfo',
        args: [address],
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'getPendingRewards',
        args: [address],
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'getTimeUntilUnlock',
        args: [address],
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'getUserDetails',
        args: [address],
      },
      // Contract-wide statistics
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'totalStaked',
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'currentRewardRate',
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'initialApr',
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'minLockDuration',
      },
    ],
        query: {
        enabled: !!address && !!contractAddress,
        refetchInterval: 30000, // Refresh every 30 seconds
        }
      })
    
    if (!data) {
    return {
      userInfo: null,
      pendingRewards: null,
      timeUntilUnlock: null,
      userDetails: null,
      totalStaked: null,
      currentRewardRate: null,
      initialApr: null,
      minLockDuration: null,
      
    }
  }

  const [
    userInfo,
    pendingRewards, 
    timeUntilUnlock,
    userDetails,
    totalStaked,
    currentRewardRate,
    initialApr,
    minLockDuration
  ] = data.map(result => result.result)


    return {
    userInfo,
    pendingRewards,
    timeUntilUnlock,
    userDetails,
    totalStaked,
    currentRewardRate,
    initialApr,
    minLockDuration
  }
}



import { STACKING_CONTRACT } from "@/common/abi";
import { publicClient } from "@/common/constant";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";

export function useGetUserStake() {
  const { address } = useAccount();
  const [userStake,  setUserStake] = useState<unknown>()

  useEffect(() => {
    ( async() => {
      const result = await publicClient.readContract({
        abi: STACKING_CONTRACT,
        address: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address,
        args: [address],
        functionName: 'getUserDetails'
      })
      console.log("res", result);
      setUserStake(result);
    })()
  }, [])

  return userStake;
}

import { STACKING_CONTRACT } from "@/common/abi";
import { publicClient } from "@/common/constant";
import { useEffect, useState } from "react";
import { Address, formatEther } from "viem";

export function useGetInitialApr() {
  const [currentApr, setCurrentApr] = useState<unknown>();
  useEffect(() => {
    ( async() => {
      const result = await publicClient.readContract({
        abi: STACKING_CONTRACT,
        address: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as Address,
        functionName: 'initialApr'
      })
      setCurrentApr(result);
      // console.log("res", formatEther(result));
    })()
  }, [])

  return currentApr;
}

import React, { useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { STAKING_CONTRACT_ABI } from "../config/ABI";

function useCurrentAPR() {
  const publicClient = usePublicClient();
  const [currentAPR, setCurrentAPR] = useState();

  useEffect(() => {
    (async () => {
      const _currentAPR = await publicClient.readContract({
        address: import.meta.env.VITE_STAKING_CONTRACT,
        abi: STAKING_CONTRACT_ABI,
        functionName: "initialApr",
      });

      console.log({_currentAPR})

     setCurrentAPR(_currentAPR)

     
     
    })();
  }, [publicClient]);
  return useMemo(() => currentAPR, [currentAPR]);
}

export default useCurrentAPR;

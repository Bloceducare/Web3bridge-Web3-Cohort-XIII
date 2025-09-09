import { useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { STAKING_CONTRACT_ABI } from "../config/staking_contract_abi";
import { formatUnits } from "viem";

const useGetStakingStats = () => {
  const publicClient = usePublicClient();
  const [totalStaked, setTotalStaked] = useState('0');
  const [currentAPR, setCurrentAPR] = useState(0n);

  useEffect(() => {

    (async () => {
    if (!publicClient) return;

      const result = await publicClient?.readContract({
        address: import.meta.env.VITE_STAKING_CONTRACT,
        abi: STAKING_CONTRACT_ABI,
        functionName: "totalStaked",
      });

      const aprResult = await publicClient?.readContract({
        address: import.meta.env.VITE_STAKING_CONTRACT,
        abi: STAKING_CONTRACT_ABI,
        functionName: "currentRewardRate",
      });

      setTotalStaked(formatUnits(result, 18));
      setCurrentAPR(aprResult as bigint);
    })();
  }, [publicClient]);

   useEffect(() => {
    if (!publicClient) return;

    const onStaked = (logs:any) => {
      const log = logs[0];
      if (log?.args) {
        setTotalStaked(formatUnits(log.args.newTotalStaked, 18));        
      }
    };

    const stakedEventAbiItem = STAKING_CONTRACT_ABI.find(
      // @ts-ignore
      (x) => x.name === "Staked" && x.type === "event"
    );

    const unwatch = publicClient.watchEvent({
      address: import.meta.env.VITE_STAKING_CONTRACT,
      event: stakedEventAbiItem,
      onLogs: onStaked,
    });

    return () => unwatch();
  }, [publicClient]);

  return useMemo(() => ({ totalStaked, currentAPR }), [totalStaked, currentAPR]);
};

export default useGetStakingStats;

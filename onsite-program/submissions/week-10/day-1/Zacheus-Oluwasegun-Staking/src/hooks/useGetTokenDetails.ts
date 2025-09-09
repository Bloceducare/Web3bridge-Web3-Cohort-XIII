import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { STAKE_TOKEN_ABI } from "../config/stake_token_abi";
import useStakeTokenStore from "@/config/store";
import { formatUnits } from "viem";

const useTokenDetails = () => {
  const publicClient = usePublicClient();
  const setSymbol = useStakeTokenStore((state) => state.setTokenSymbol);
  const tokenSymbol = useStakeTokenStore((state) => state.tokenSymbol);
  const [userBal, setUserBal] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const { address } = useAccount();

  useEffect(() => {
    (async () => {
      const result = await publicClient?.readContract({
        address: import.meta.env.VITE_STAKE_TOKEN,
        abi: STAKE_TOKEN_ABI,
        functionName: "symbol",
      });

      setSymbol(result as string);
    })();
  }, [publicClient]);

  useEffect(() => {

    (async () => {
    if (!publicClient || !address) return;

      const balResult = await publicClient.readContract({
        address: import.meta.env.VITE_STAKE_TOKEN,
        abi: STAKE_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      setUserBal(Number(formatUnits(balResult, 18)));

    })();
  }, [publicClient, address]);

  useEffect(() => {

    (async () => {
    if (!publicClient || !address) return;

      const allowanceResult = await publicClient.readContract({
        address: import.meta.env.VITE_STAKE_TOKEN,
        abi: STAKE_TOKEN_ABI,
        functionName: "allowance",
        args: [address, import.meta.env.VITE_STAKING_CONTRACT],
      });

      setAllowance(Number(formatUnits(allowanceResult, 18)));
    })();
  }, [publicClient, address]);

  return useMemo(() => ({ tokenSymbol, userBal, allowance }), [tokenSymbol, userBal, allowance]);
};

export default useTokenDetails;

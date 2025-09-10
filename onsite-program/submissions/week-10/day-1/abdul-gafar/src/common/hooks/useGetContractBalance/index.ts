import { STAKING_CONTRACT_TOKEN } from "@/common/abi";
import { publicClient } from "@/common/constant";
import { useEffect, useState } from "react";
import { Address, formatEther, formatUnits } from "viem";
import { useAccount } from "wagmi";

export function useGetContractBalance() {
  const { address } = useAccount();
  const [balance, setBalance] = useState<bigint | undefined | unknown>();
  const tokenAddress = process.env.NEXT_PUBLIC_STAKING_TOKEN_ADDRESS as Address;
  
  useEffect(() => {
    (async () => {
      if (!address || !tokenAddress) return;

      try {
        const rawBalance = await publicClient.readContract({
          address: tokenAddress,
          abi: STAKING_CONTRACT_TOKEN,
          functionName: "balanceOf",
          args: [address],
        });

        const decimals = await publicClient.readContract({
          address: tokenAddress,
          abi: STAKING_CONTRACT_TOKEN,
          functionName: "decimals",
        });

        // @ts-ignore
        setBalance(formatUnits(rawBalance, 18));
      } catch (err) {
        console.error("Failed to fetch token balance:", err);
      }
    })();
  }, [address, tokenAddress]);

  return balance;
}

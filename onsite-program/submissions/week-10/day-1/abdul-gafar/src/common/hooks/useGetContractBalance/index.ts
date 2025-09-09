import { publicClient } from "@/common/constant";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";

export function useGetContractBalance() {
  const { address } = useAccount();
  const [balance, setBalance] = useState<bigint | undefined | unknown>();
  
  useEffect(() => {
    (async () => {
      if (!address) {
        console.error("Invalid or missing staking token address");
        return;
      }
      const totalToken = await publicClient.getBalance({
        address: address as Address,
      })
      // const balance = await publicClient.getBalance({ 
      //   address: tokenAddress,
      //   symbol: 'VAT'
      // })
      // console.log("Inside balance", BigInt(totalToken))
      setBalance(totalToken)
    })();
  }, []);

  return balance;
}

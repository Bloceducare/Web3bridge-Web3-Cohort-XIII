import { useCallback, useEffect, useState } from "react";
import { createPublicClient, createWalletClient, custom, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { STAKE_CONTRACT_ABI, STAKE_TOKEN_ABI } from "../config/ABI";

function useStakeAmount() {
  const [balance, setBalance] = useState();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });

  const { address } = useAccount();


  useEffect(() => {
    async function fetchBalance() {
      if (!address) return;

      try {
        const result = await publicClient.readContract({
          address: import.meta.env.VITE_STAKING_TOKEN, // ERC20 contract
          abi: STAKE_TOKEN_ABI,
          functionName: "balanceOf",
          args: [address],
        });
        setBalance(result);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    }
    fetchBalance();
  }, [address, publicClient]);

 
  const approve = useCallback(
    async (amount) => {
      if (!address) throw new Error("Wallet not connected");
      const bigAmount = parseEther(amount.toString());

      try {
        const txHash = await walletClient.writeContract({
          account: address,
          address: import.meta.env.VITE_STAKING_TOKEN, 
          abi: STAKE_TOKEN_ABI,
          functionName: "approve",
          args: [import.meta.env.VITE_STAKING_CONTRACT, bigAmount],
        });
        console.log("Approval tx sent:", txHash);
        return txHash;
      } catch (err) {
        console.error("Approval failed:", err);
        throw err;
      }
    },
    [address, walletClient]
  );

 
  const stake = useCallback(
    async (amount) => {
      if (!address) throw new Error("Wallet not connected");
      const bigAmount = parseEther(amount.toString());

      try {
        const txHash = await walletClient.writeContract({
          account: address,
          address: import.meta.env.VITE_STAKING_CONTRACT, // Staking contract
          abi: STAKE_CONTRACT_ABI,
          functionName: "stake",
          args: [bigAmount],
        });
        console.log("Stake tx sent:", txHash);
        return txHash;
      } catch (err) {
        console.error("Staking failed:", err);
        throw err;
      }
    },
    [address, walletClient]
  );

  return { balance, approve, stake };
}

export default useStakeAmount;

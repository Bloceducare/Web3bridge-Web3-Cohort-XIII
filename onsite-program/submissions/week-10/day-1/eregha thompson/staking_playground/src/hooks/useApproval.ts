import { erc20Abi } from "viem"; // wagmi already ships a standard ERC20 ABI

import { parseEther } from "viem";


import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

export const TOKEN_ADDRESS = "0xdEbBAbc9B167877a645EF5E416b3913294a8046F";

export function useTokenApproval() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const approve = (spender: `0x${string}`, amount: string) => {
    writeContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, parseEther(amount)], // approve staking contract
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return { approve, isPending, isConfirming, isConfirmed, hash };
}

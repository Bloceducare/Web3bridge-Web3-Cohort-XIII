import {
  STAKING_CONTRACT_ADDRESS,
  TOKEN_ABI,
  TOKEN_ADDRESS,
  STAKING_CONTRACT_ABI,
} from "@/constants";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export const useApproveAndStakeToken = (amount: number) => {
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { isSuccess: isConfirmedStake } = useWaitForTransactionReceipt({hash});

  const approve = useCallback(async () => {
    try {
      const txHash = await writeContractAsync({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "approve",
        args: [TOKEN_ADDRESS, BigInt(amount)],
      });
      setHash(txHash);
      if (isConfirmed) {
        const stakeHash = await writeContractAsync({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_CONTRACT_ABI,
          functionName: "stake",
          args: [BigInt(amount)],
        });
        setHash(stakeHash);
        if (isConfirmedStake) {
          console.log("stake hash: ", stakeHash);
          toast.success(`Succesfully staked ${amount}`);
        } else {
          throw new Error("Unable to stake");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
        console.error(err);
        throw err;
      } else {
        toast.error("Something went wrong");
        console.error(err);
      }
    }
  }, [writeContractAsync, amount, isConfirmed, isConfirmedStake]);

  return { approve, isConfirmedStake };
};

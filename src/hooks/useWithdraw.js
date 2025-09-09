import { parseEther } from 'viem';
import { useWriteContract, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { STAKING_CONTRACT_ABI } from '../config/ABI.js';

const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT;

export const useWithdraw = () => {
  const { writeContractAsync, error, isPending } = useWriteContract();
  const config = useConfig();

  const withdraw = async (amount) => {
    const amountWei = parseEther(amount);
    const hash = await writeContractAsync({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: 'withdraw',
      args: [amountWei],
    });
    await waitForTransactionReceipt(config, { hash });
    return hash;
  };

  return {
    withdraw,
    isPending,
    error,
  };
};

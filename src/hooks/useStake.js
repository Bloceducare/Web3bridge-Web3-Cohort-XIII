import { parseEther } from 'viem';
import { useWriteContract, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { STAKING_CONTRACT_ABI } from '../config/ABI.js';

const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT;

export const useStake = () => {
  const { writeContractAsync, error, isPending } = useWriteContract();
  const config = useConfig();

  const stake = async (amount) => {
    const amountWei = parseEther(amount);
    const hash = await writeContractAsync({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: 'stake',
      args: [amountWei],
    });
    await waitForTransactionReceipt(config, { hash });
    return hash;
  };

  return {
    stake,
    isPending,
    error,
  };
};

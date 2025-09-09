import { parseEther } from 'viem';
import { useWriteContract, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { STAKING_TOKEN_ABI } from '../config/ABI.js';

const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT;
const STAKING_TOKEN_ADDRESS = import.meta.env.VITE_STAKING_TOKEN;

export const useTokenApproval = () => {
  const { writeContractAsync, error, isPending } = useWriteContract();
  const config = useConfig();
  

  const approveToken = async (amount) => {
    const amountWei = parseEther(amount);
    const hash = await writeContractAsync({
      address: STAKING_TOKEN_ADDRESS,
      abi: STAKING_TOKEN_ABI,
      functionName: 'approve',
      args: [STAKING_CONTRACT_ADDRESS, amountWei],
    });
    await waitForTransactionReceipt(config, { hash });
    return hash;
  };

 
  const needsApproval = (amount, allowance) => {
    if (!allowance || !amount) return true;
    try {
      return allowance < parseEther(amount);
    } catch {
      return true;
    }
  };

  return {
    approveToken,
    needsApproval,
    isPending,
    error,
  };
};

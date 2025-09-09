import { useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { TOKEN_CONTRACT_ADDRESS, STAKING_CONTRACT_ADDRESS, TOKEN_ABI } from '../config/contracts';

export function useTokenApproval() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const approveToken = useCallback(async (amount: string) => {
    try {
      await writeContract({
        address: TOKEN_CONTRACT_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [STAKING_CONTRACT_ADDRESS, parseEther(amount)],
      });
      toast.success('Approval transaction submitted');
    } catch (error: any) {
      toast.error('Approval failed: ' + error.message);
    }
  }, [writeContract]);

  return {
    approveToken,
    isApproving: isPending || isConfirming,
    hash
  };
}
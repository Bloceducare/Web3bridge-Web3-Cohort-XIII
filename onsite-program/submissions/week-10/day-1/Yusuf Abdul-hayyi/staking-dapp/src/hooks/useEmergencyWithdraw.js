import { useCallback } from "react";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { STAKING_CONTRACT_ABI } from "../config/ABI";

export default function useEmergencyWithdraw() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const walletClient = useWalletClient();

  const emergencyWithdraw = useCallback(async () => {
    if (!address || !walletClient) {
      toast.error("Connect wallet first");
      return;
    }

    try {
      const txHash = await writeContractAsync({
        address: import.meta.env.VITE_STAKING_CONTRACT,
        abi: STAKING_CONTRACT_ABI,
        functionName: "emergencyWithdraw",
      });

      await walletClient.waitForTransactionReceipt({ hash: txHash });
      toast.success("Emergency withdrawal successful");
    } catch (err) {
      toast.error("Emergency withdraw failed");
      console.error(err);
    }
  }, [address, walletClient, writeContractAsync]);

  return { emergencyWithdraw };
}

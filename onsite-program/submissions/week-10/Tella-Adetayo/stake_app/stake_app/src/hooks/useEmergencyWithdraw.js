import React, { useCallback } from 'react'
import { createWalletClient, custom } from 'viem';
import { sepolia } from 'viem/chains';
import { useAccount } from 'wagmi';
import { STAKE_CONTRACT_ABI } from '../config/ABI';
import { toast } from 'sonner';

const useEmergencyWithdraw = () => {
     const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
    });

    const { address } = useAccount(); 

    const emergencyWithdraw = useCallback(async () => {
        if (!address) throw new Error("Wallet must be connected"); 
        if (!_amount || Number(_amount) <= 0) throw new Error("Enter valid amount");

        try {
            const txHash = await walletClient.writeContract({
                account: address,
                address: import.meta.env.VITE_STAKING_CONTRACT,
                abi: STAKE_CONTRACT_ABI,
                functionName: "emergencyWithdraw",
                args: [],
            })
            toast("Emergency withdraw successfully!", {
                description: `Transaction Hash: ${txHash}`,
                action: {
                label: "View",
                onClick: () => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank")}
            }) 
            return txHash
        } catch(err) {
            // console.error(err); 
            toast.error(`Emergency Withdraw failed: ${err}`); 
        }
    }, [address, walletClient])

  return { emergencyWithdraw }
}

export default useEmergencyWithdraw

import React, { useCallback } from 'react'
import { createWalletClient, custom } from 'viem';
import { sepolia } from 'viem/chains';
import { useAccount } from 'wagmi';
import { STAKE_CONTRACT_ABI } from '../config/ABI';
import { toast } from 'sonner';

const useClaimRewards = () => {
     const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
    });

    const { address } = useAccount(); 

    const claimRewards = useCallback(async () => {
        if (!address) toast.error("Wallet not connected"); 

        try {
            const txHash = await walletClient.writeContract({
                account: address,
                address: import.meta.env.VITE_STAKING_CONTRACT,
                abi: STAKE_CONTRACT_ABI,
                functionName: "claimRewards",
                args: [],
            }); 
            
            toast("Transaction sent!", {
                description: `Tx Hash: ${txHash}`,
                action: { label: "View", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank") },
            });

            return txHash
        } catch(err) {
            console.error(err); 
            toast.error(`Claiming of reward failed: ${err}`);
        }
    }, [address, walletClient])

  return { claimRewards }
}

export default useClaimRewards; 

import { useEffect, useState } from "react";
import { createPublicClient, formatEther, http } from "viem";
import { sepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { STAKE_CONTRACT_ABI } from "../config/ABI";

function useCurrentUserStakeParams() {
    const [userStakeDetails, setUserStakeDetails] = useState({
        stakedAmount: 0,
        lastStakeTimestamp: 0,  
        pendingRewards: 0, 
        timeUntilUnlock: 0, 
        canWithdraw: false 

    }); 
    const publicClient = createPublicClient({
        chain: sepolia, 
        transport: http()
    })

    const { address } = useAccount();

    function formatDuration(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        seconds %= 24 * 60 * 60;

        const hours = Math.floor(seconds / (60 * 60));
        seconds %= 60 * 60;

        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;

        return { days, hours, minutes, seconds };
    }

    useEffect(() => {
        async function getDetails() {
            if (!address) return; 

            try {
                const result = await publicClient.readContract({
                    address: import.meta.env.VITE_STAKING_CONTRACT,
                    abi: STAKE_CONTRACT_ABI,
                    functionName: "getUserDetails",
                    args: [address]
                })
                const { stakedAmount, lastStakeTimestamp, pendingRewards, timeUntilUnlock, canWithdraw } = result;
                const seconds = parseInt(timeUntilUnlock?.toString() || "0");
                setUserStakeDetails({
                stakedAmount: parseFloat(formatEther(stakedAmount)).toFixed(4),    
                lastStakeTimestamp: Number(lastStakeTimestamp),
                pendingRewards: formatEther(pendingRewards) ,
                timeUntilUnlock: formatDuration(seconds),
                canWithdraw,
                })

                console.log(timeUntilUnlock); 
            } catch(e) {
                console.error(e); 
            }
        }
        getDetails(); 
    }, [address] )

    return userStakeDetails; 

}

export default useCurrentUserStakeParams; 
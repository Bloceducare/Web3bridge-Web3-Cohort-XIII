import { parseAbiItem } from 'viem'
import { publicClient } from '../config/publicClient'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT

export function useStakingEvents() {
  const [stakeEvents, setStakeEvents] = useState<any[]>([])
  const [withdrawEvents, setWithdrawEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { address } = useAccount() // Get current user's address

  useEffect(() => {
    if (!address) return

    setLoading(true)
    setError(null)

    // Watch Staked events for this user
    const unwatchStake = publicClient.watchEvent({
      address: STAKING_CONTRACT_ADDRESS,
      event: parseAbiItem(
        'event Staked(address user,uint256 amount,uint256 timestamp,uint256 newTotalStaked,uint256 currentRewardRate)'
      ),
      onLogs: logs => {
        // Filter logs for this user address
        const userLogs = logs.filter(log => log.args.user?.toLowerCase() === address.toLowerCase())
        if (userLogs.length > 0) {
          setStakeEvents(prev => [...prev, ...userLogs])
          // You can perform any action here, e.g. refetch balances, show toast, etc.
        }
      }
    })

    // Watch Withdrawn events for this user
    const unwatchWithdraw = publicClient.watchEvent({
      address: STAKING_CONTRACT_ADDRESS,
      event: parseAbiItem(
        'event Withdrawn(address user,uint256 amount,uint256 timestamp,uint256 newTotalStaked,uint256 currentRewardRate,uint256 rewardsAccrued)'
      ),
      onLogs: logs => {
        const userLogs = logs.filter(log => log.args.user?.toLowerCase() === address.toLowerCase())
        if (userLogs.length > 0) {
          setWithdrawEvents(prev => [...prev, ...userLogs])
          // Perform any action here as well
        }
      }
    })

    setLoading(false)

    // Cleanup on unmount or address change
    return () => {
      unwatchStake()
      unwatchWithdraw()
    }
  }, [address])

  return { stakeEvents, withdrawEvents, loading, error }
}
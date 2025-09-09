import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useToast } from '@/hooks/use-toast'
import { sepolia } from 'wagmi/chains'
import { STAKING_ABI } from '../config/Abi'
import { erc20Abi } from 'viem'

const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT
const ERC20_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_TOKEN

export function useStaking() {
  const { address, isConnected, chain } = useAccount()
  const { toast } = useToast()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const { data: userStake, refetch: refetchUserStake } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getUserDetails',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })
  
  

  // Pending reward
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Total staked in contract
  const { data: totalStaked } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'totalStaked'
  })

  // Current reward rate
  const { data: rewardRate } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'currentRewardRate'
  })

  // User's token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // User's token allowance for staking contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, STAKING_CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address }
  })

  // Approve tokens for staking
  const approveTokens = async (amount: string) => {
    if (!isConnected || !address) {
      toast({ title: "Wallet not connected", variant: "destructive" })
      return false
    }

    try {
      const amountInWei = parseEther(amount)
      writeContract({
        address: ERC20_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [STAKING_CONTRACT_ADDRESS, amountInWei],
      })
      toast({ title: "Token approval submitted" })
      return true
    } catch (error) {
      toast({ 
        title: "Approval failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      })
      return false
    }
  }

  // Check if user has sufficient balance and allowance
  const checkBalanceAndAllowance = async (amount: string) => {
    const amountInWei = parseEther(amount)
    const balance = tokenBalance || BigInt(0)
    const currentAllowance = allowance || BigInt(0)
  
    if (balance < amountInWei) {
      toast({ title: "Insufficient token balance", variant: "destructive" })
      return false
    }
  
    if (currentAllowance < amountInWei) {
      const approvalStatus = await approveTokens(amount)
      return approvalStatus
    }
  
    return true
  }

  const stake = async (amount: string) => {
    if (!isConnected || !address) {
      toast({ title: "Wallet not connected", variant: "destructive" })
      return
    }

    if (!(await checkBalanceAndAllowance(amount))) {
      return
    }
    
    try {
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [parseEther(amount)],
      })
      toast({ title: "Staking transaction submitted" })
    } catch (error) {
      toast({ 
        title: "Staking failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      })
    }
  }

  const withdraw = async (amount : string) => {
    if (!isConnected || !address) {
      toast({ title: "Wallet not connected", variant: "destructive" })
      return
    }
    
    try {
      const tx = writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'withdraw',
        args:[parseEther(amount)],
      })
      toast({ title: "Withdrawal transaction submitted" })
    const receipt = await waitForTransactionReceipt({ hash: tx.hash })
    if (receipt.status === 'success') {
      toast({ title: "Withdrawal successful" })
    } else {
      toast({ title: "Withdrawal failed on-chain", variant: "destructive" })
    }
    } catch (error) {
      toast({ 
        title: "Withdrawal failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      })
    }
  }

  const claimRewards = async () => {
    if (!isConnected || !address) {
      toast({ title: "Wallet not connected", variant: "destructive" })
      return
    }
    
    try {
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'claimRewards',
      })
      toast({ title: "Claim rewards transaction submitted" })
    } catch (error) {
      toast({ 
        title: "Claim failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      })
    }
  }

  const emergencyWithdraw = async () => {
    if (!isConnected || !address) {
      toast({ title: "Wallet not connected", variant: "destructive" })
      return
    }
    
    try {
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'emergencyWithdraw',
      })
      toast({ title: "Emergency withdrawal submitted" })
    } catch (error) {
      toast({ 
        title: "Emergency withdrawal failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      })
    }
  }

  // // Mock data for demonstration when no real contract
  // const mockData = {
  //   userStake: parseEther("125.5"),
  //   pendingRewards: parseEther("12.75"),
  //   totalStaked: parseEther("1500000"),
  //   rewardRate: parseEther("0.05"), // 5% APR
  //   tokenBalance: parseEther("1000"),
  //   allowance: parseEther("500"),
  //   unlockTime: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days from now
  // }

  return {
    // Contract data (fallback to mock for demo)
    // userStake: userStake ? formatEther(userStake) : formatEther(mockData.userStake),
    // pendingRewards: pendingRewards ? formatEther(pendingRewards) : formatEther(mockData.pendingRewards),
    // totalStaked: totalStaked ? formatEther(totalStaked) : formatEther(mockData.totalStaked),
    // rewardRate: rewardRate ? formatEther(rewardRate) : formatEther(mockData.rewardRate),
    // tokenBalance: tokenBalance ? formatEther(tokenBalance) : formatEther(mockData.tokenBalance),
    // allowance: allowance ? formatEther(allowance) : formatEther(mockData.allowance),
    // unlockTime: mockData.unlockTime,
    
    // Helper functions
    needsApproval: (amount: string) => {
      const currentAllowance = allowance || BigInt(0)
      return currentAllowance < parseEther(amount)
    },
    
    // Contract functions
    stake,
    withdraw,
    claimRewards,
    emergencyWithdraw,
    approveTokens,
    
    // Transaction state
    isTransacting: isPending || isConfirming,
    isConnected,
    address,
    
    // Refresh functions
    refetch: () => {
      refetchUserStake()
      refetchRewards()
      refetchBalance()
      refetchAllowance()
    }
  }
}
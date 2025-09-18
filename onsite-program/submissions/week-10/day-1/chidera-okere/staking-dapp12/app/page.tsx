"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RainbowWalletConnector } from "@/components/rainbow-wallet-connector"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import {
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Target,
  Coins,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react"

// Import ABIs and contract addresses from config
import { STAKING_ABI, TOKEN_ABI, STAKING_CONTRACT_ADDRESS, TOKEN_ADDRESS } from "@/config/ABI"

// ABIs moved to config/ABI.ts

export default function NexusStakeDApp() {
  // Use wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Create ethers provider and signer from wagmi clients
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  
  // Convert wagmi clients to ethers equivalents
  useEffect(() => {
    if (publicClient) {
      // Create a provider that connects to the public client
      const provider = new ethers.JsonRpcProvider();
      setProvider(provider);
      
      if (walletClient) {
        // Create a signer from the wallet client
        provider.getSigner().then(signer => {
          setSigner(signer);
        }).catch(error => {
          console.error("Error getting signer:", error);
        });
      }
    }
  }, [publicClient, walletClient]);

  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null)
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null)

  // User data
  const [userBalance, setUserBalance] = useState("0")
  const [stakedAmount, setStakedAmount] = useState("0")
  const [pendingRewards, setPendingRewards] = useState("0")
  const [timeUntilUnlock, setTimeUntilUnlock] = useState(0)
  const [canWithdraw, setCanWithdraw] = useState(false)

  // Protocol data
  const [totalStaked, setTotalStaked] = useState("0")
  const [currentAPR, setCurrentAPR] = useState("0")
  const [totalRewards, setTotalRewards] = useState("0")
  const [minLockDuration, setMinLockDuration] = useState("0")
  const [emergencyPenalty, setEmergencyPenalty] = useState("0")

  // Form states
  const [stakeAmount, setStakeAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [calculatorAmount, setCalculatorAmount] = useState("")
  const [error, setError] = useState("")

  // Contract addresses imported from config/ABI.ts

  // Initialize contracts when wallet is connected
  useEffect(() => {
    if (isConnected && address && signer) {
      // Initialize contracts
      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      
      setStakingContract(stakingContract);
      setTokenContract(tokenContract);
      
      // Load initial data
      loadUserData(address, stakingContract, tokenContract);
      loadProtocolData(stakingContract);
    }
  }, [isConnected, address, signer]);

  // Set up data refresh interval
  useEffect(() => {
    if (isConnected && address && stakingContract && tokenContract) {
      const interval = setInterval(() => {
        loadUserData(address, stakingContract, tokenContract)
        loadProtocolData(stakingContract)
      }, 10000) // Refresh every 10 seconds

      return () => clearInterval(interval)
    }
  }, [isConnected, address, stakingContract, tokenContract])



  const loadUserData = async (userAddress: string, staking: ethers.Contract, token: ethers.Contract) => {
    try {
      const [balance, userDetails, rewards] = await Promise.all([
        token.balanceOf(userAddress),
        staking.getUserDetails(userAddress),
        staking.getPendingRewards(userAddress),
      ])

      setUserBalance(ethers.formatEther(balance))
      setStakedAmount(ethers.formatEther(userDetails[0]))
      setPendingRewards(ethers.formatEther(rewards))
      setTimeUntilUnlock(Number(userDetails[3]))
      setCanWithdraw(userDetails[4])
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const loadProtocolData = async (staking: ethers.Contract) => {
    try {
      const [total, apr, totalRewardsData, minLock, penalty] = await Promise.all([
        staking.totalStaked(),
        staking.currentRewardRate(),
        staking.getTotalRewards(),
        staking.minLockDuration(),
        staking.emergencyWithdrawPenalty(),
      ])

      setTotalStaked(ethers.formatEther(total))
      setCurrentAPR(apr.toString())
      setTotalRewards(ethers.formatEther(totalRewardsData))
      setMinLockDuration((Number(minLock) / 86400).toFixed(1)) // Convert to days
      setEmergencyPenalty(penalty.toString())
    } catch (error) {
      console.error("Error loading protocol data:", error)
    }
  }

  const handleMintTokens = async () => {
    if (!tokenContract || !address) return

    setLoading(true)
    setError("")
    try {
      const amount = ethers.parseEther("1000") // Mint 1000 tokens for testing
      const tx = await tokenContract.mint(address, amount)
      await tx.wait()

      await loadUserData(address, stakingContract!, tokenContract)
    } catch (error) {
      console.error("Error minting tokens:", error)
      setError("Failed to mint tokens. You may not have permission.")
    }
    setLoading(false)
  }

  const handleStake = async () => {
    if (!stakingContract || !tokenContract || !stakeAmount || !address) return

    setLoading(true)
    setError("")
    try {
      const amount = ethers.parseEther(stakeAmount)
      const allowance = await tokenContract.allowance(address, STAKING_CONTRACT_ADDRESS)

      if (allowance < amount) {
        const approveTx = await tokenContract.approve(STAKING_CONTRACT_ADDRESS, amount)
        await approveTx.wait()
      }

      const tx = await stakingContract.stake(amount)
      await tx.wait()

      setStakeAmount("")
      await loadUserData(address, stakingContract, tokenContract)
      await loadProtocolData(stakingContract)
    } catch (error: any) {
      console.error("Error staking:", error)
      setError(error.reason || "Failed to stake tokens. Please try again.")
    }
    setLoading(false)
  }

  const handleWithdraw = async () => {
    if (!stakingContract || !withdrawAmount || !address) return

    setLoading(true)
    setError("")
    try {
      const amount = ethers.parseEther(withdrawAmount)
      const tx = await stakingContract.withdraw(amount)
      await tx.wait()

      setWithdrawAmount("")
      await loadUserData(address, stakingContract, tokenContract!)
      await loadProtocolData(stakingContract)
    } catch (error: any) {
      console.error("Error withdrawing:", error)
      setError(error.reason || "Failed to withdraw tokens. Check lock duration.")
    }
    setLoading(false)
  }

  const handleClaimRewards = async () => {
    if (!stakingContract || !address) return

    setLoading(true)
    setError("")
    try {
      const tx = await stakingContract.claimRewards()
      await tx.wait()
      await loadUserData(address, stakingContract, tokenContract!)
    } catch (error: any) {
      console.error("Error claiming rewards:", error)
      setError(error.reason || "Failed to claim rewards.")
    }
    setLoading(false)
  }

  const handleEmergencyWithdraw = async () => {
    if (!stakingContract || !address) return

    const confirmed = window.confirm(
      `Emergency withdrawal will incur a ${emergencyPenalty}% penalty. Are you sure you want to continue?`,
    )
    if (!confirmed) return

    setLoading(true)
    setError("")
    try {
      const tx = await stakingContract.emergencyWithdraw()
      await tx.wait()
      await loadUserData(address, stakingContract, tokenContract!)
      await loadProtocolData(stakingContract)
    } catch (error: any) {
      console.error("Error emergency withdrawing:", error)
      setError(error.reason || "Failed to emergency withdraw.")
    }
    setLoading(false)
  }

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Unlocked"
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${mins}m`
  }

  const calculateRewards = (amount: string) => {
    if (!amount || isNaN(Number(amount))) return { yearly: "0", monthly: "0", daily: "0" }
    const yearly = (Number(amount) * Number(currentAPR)) / 100
    const monthly = yearly / 12
    const daily = yearly / 365
    return { yearly: yearly.toFixed(4), monthly: monthly.toFixed(4), daily: daily.toFixed(4) }
  }

  const rewards = calculateRewards(calculatorAmount)

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-accent/5">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-accent-foreground rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black font-montserrat text-primary text-balance">Nexus Stake</h1>
                <p className="text-lg text-muted-foreground font-medium">Next-generation staking protocol</p>
              </div>
            </div>

            <div>
              <RainbowWalletConnector />
              {isConnected && (
                <div className="text-right space-y-2 mt-2">
                  <p className="text-sm text-muted-foreground">
                    Balance: {Number.parseFloat(userBalance).toFixed(4)} MTK
                  </p>
                  <Button
                    onClick={handleMintTokens}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                  >
                    Mint Test Tokens
                  </Button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Card className="p-4 mb-6 bg-destructive/10 border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </Card>
          )}

          {/* Interactive staking calculator */}
          <Card className="p-8 bg-card/80 backdrop-blur-sm border-0 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold font-montserrat text-card-foreground mb-2">Rewards Calculator</h2>
              <p className="text-muted-foreground">Calculate your potential staking rewards</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-card-foreground mb-2 block">Stake Amount</label>
                  <Input
                    type="number"
                    placeholder="Enter amount to stake"
                    value={calculatorAmount}
                    onChange={(e) => setCalculatorAmount(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  Current APR: {currentAPR}%
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-xl">
                  <p className="text-xs text-slate-800 mb-1">Daily</p>
                  <p className="text-lg font-bold text-primary">{rewards.daily}</p>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-xl">
                  <p className="text-xs text-slate-800 mb-1">Monthly</p>
                  <p className="text-lg font-bold text-accent">{rewards.monthly}</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-xl">
                  <p className="text-xs text-slate-800 mb-1">Yearly</p>
                  <p className="text-lg font-bold text-primary">{rewards.yearly}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {isConnected && address && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Current APR</p>
                <p className="text-2xl font-bold text-primary">{currentAPR}%</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Coins className="w-6 h-6 text-accent" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Staked</p>
                <p className="text-2xl font-bold text-accent">{Number.parseFloat(totalStaked).toFixed(0)}</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Rewards</p>
                <p className="text-2xl font-bold text-primary">{Number.parseFloat(totalRewards).toFixed(2)}</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Lock Duration</p>
                <p className="text-lg font-bold text-accent">{minLockDuration} days</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Staking Actions */}
              <Card className="lg:col-span-2 p-8 bg-card border-0 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold font-montserrat text-card-foreground">Stake & Earn</h2>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-primary/5 rounded-xl">
                    <label className="text-sm font-semibold text-card-foreground mb-3 block">Stake Amount</label>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="flex-1 h-12 text-lg"
                      />
                      <Button
                        onClick={handleStake}
                        disabled={loading || !stakeAmount}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 px-8"
                      >
                        {loading ? "Staking..." : "Stake"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-6 bg-accent/5 rounded-xl">
                    <label className="text-sm font-semibold text-card-foreground mb-3 block">Withdraw Amount</label>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 h-12 text-lg"
                        disabled={!canWithdraw}
                      />
                      <Button
                        onClick={handleWithdraw}
                        disabled={loading || !withdrawAmount || !canWithdraw}
                        variant="outline"
                        size="lg"
                        className="px-8 border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
                      >
                        {loading ? "Withdrawing..." : "Withdraw"}
                      </Button>
                    </div>
                    {!canWithdraw && (
                      <p className="text-xs text-accent mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Unlock in: {formatTime(timeUntilUnlock)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* User Position */}
              <Card className="p-8 bg-card border-0 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-xl font-bold font-montserrat text-card-foreground">Your Position</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground">Staked</span>
                      <span className="font-bold text-primary">{Number.parseFloat(stakedAmount).toFixed(4)}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-accent/5 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground">Rewards</span>
                      <span className="font-bold text-accent">{Number.parseFloat(pendingRewards).toFixed(6)}</span>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Lock Status</span>
                        <span className="text-xs text-muted-foreground">{canWithdraw ? "Unlocked" : "Locked"}</span>
                      </div>
                      <Progress
                        value={
                          canWithdraw
                            ? 100
                            : Math.max(10, 100 - (timeUntilUnlock / (Number(minLockDuration) * 86400)) * 100)
                        }
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleClaimRewards}
                      disabled={loading || Number.parseFloat(pendingRewards) === 0}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      size="lg"
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      {loading ? "Claiming..." : "Claim Rewards"}
                    </Button>

                    <Button
                      onClick={handleEmergencyWithdraw}
                      disabled={loading || Number.parseFloat(stakedAmount) === 0}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Emergency Withdraw
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Emergency withdraw incurs {emergencyPenalty}% penalty
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

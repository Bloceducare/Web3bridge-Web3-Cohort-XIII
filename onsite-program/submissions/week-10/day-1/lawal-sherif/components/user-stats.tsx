"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Wallet, TrendingUp, Clock, Gift } from "lucide-react"
import { useWeb3, type UserStakeInfo } from "@/hooks/use-web3"

export function UserStats() {
  const { isConnected, getUserStakeInfo } = useWeb3()
  const [userInfo, setUserInfo] = useState<UserStakeInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isConnected) {
      loadUserInfo()
      const interval = setInterval(loadUserInfo, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isConnected])

  const loadUserInfo = async () => {
    try {
      const info = await getUserStakeInfo()
      setUserInfo(info)
    } catch (error) {
      console.error("Failed to load user info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Unlocked"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const getUnlockProgress = (timeUntilUnlock: number) => {
    if (timeUntilUnlock <= 0) return 100
    // Assuming 24 hours lock duration for progress calculation
    const totalLockTime = 24 * 3600 // 24 hours in seconds
    const elapsed = totalLockTime - timeUntilUnlock
    return Math.max(0, Math.min(100, (elapsed / totalLockTime) * 100))
  }

  if (!isConnected) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Connect wallet to view stats</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Staked Amount</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {userInfo ? Number.parseFloat(userInfo.stakedAmount).toFixed(4) : "0.0000"}
          </div>
          <p className="text-xs text-muted-foreground">Tokens staked</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Pending Rewards</CardTitle>
          <Gift className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {userInfo ? Number.parseFloat(userInfo.pendingRewards).toFixed(6) : "0.000000"}
          </div>
          <p className="text-xs text-muted-foreground">Tokens earned</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Lock Status</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-card-foreground">
                {formatTime(userInfo?.timeUntilUnlock || 0)}
              </span>
              <Badge variant={userInfo?.canWithdraw ? "default" : "secondary"}>
                {userInfo?.canWithdraw ? "Unlocked" : "Locked"}
              </Badge>
            </div>
            <Progress value={getUnlockProgress(userInfo?.timeUntilUnlock || 0)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Stake Date</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {userInfo?.lastStakeTimestamp ? new Date(userInfo.lastStakeTimestamp * 1000).toLocaleDateString() : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">Last stake time</p>
        </CardContent>
      </Card>
    </div>
  )
}

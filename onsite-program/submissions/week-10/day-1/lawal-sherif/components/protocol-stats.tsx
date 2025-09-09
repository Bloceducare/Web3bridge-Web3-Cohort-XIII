"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Percent, Shield } from "lucide-react"
import { useWeb3 } from "@/hooks/use-web3"

export function ProtocolStats() {
  const { getProtocolStats } = useWeb3()
  const [stats, setStats] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const protocolStats = await getProtocolStats()
      setStats(protocolStats)
    } catch (error) {
      console.error("Failed to load protocol stats:", error)
    } finally {
      setIsLoading(false)
    }
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
          <CardTitle className="text-sm font-medium text-card-foreground">Total Value Locked</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {stats ? Number.parseFloat(stats.totalStaked).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"}
          </div>
          <p className="text-xs text-muted-foreground">Tokens staked</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Current APR</CardTitle>
          <Percent className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{stats ? `${stats.currentRewardRate}%` : "0%"}</div>
          <p className="text-xs text-muted-foreground">Annual percentage rate</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Total Rewards</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {stats
              ? Number.parseFloat(stats.totalRewards).toLocaleString(undefined, { maximumFractionDigits: 2 })
              : "0"}
          </div>
          <p className="text-xs text-muted-foreground">Available rewards</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Protocol Status</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={stats?.isPaused ? "destructive" : "default"}>{stats?.isPaused ? "Paused" : "Active"}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats?.isPaused ? "Staking is currently paused" : "Staking is active"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

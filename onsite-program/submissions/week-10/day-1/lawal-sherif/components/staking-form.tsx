"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, TrendingUp, Clock, Coins } from "lucide-react"
import { useWeb3, type TokenInfo } from "@/hooks/use-web3"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function StakingForm() {
  const { isConnected, stake, withdraw, emergencyWithdraw, claimRewards, getTokenInfo, getUserStakeInfo } = useWeb3()
  const { toast } = useToast()

  const [stakeAmount, setStakeAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [userStakeInfo, setUserStakeInfo] = useState<any>(null)

  // Load token and user info
  useEffect(() => {
    if (isConnected) {
      loadData()
    }
  }, [isConnected])

  const loadData = async () => {
    try {
      const [tokenData, stakeData] = await Promise.all([getTokenInfo(), getUserStakeInfo()])
      setTokenInfo(tokenData)
      setUserStakeInfo(stakeData)
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || Number.parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await stake(stakeAmount)
      toast({
        title: "Stake successful",
        description: `Successfully staked ${stakeAmount} tokens`,
      })
      setStakeAmount("")
      await loadData()
    } catch (error: any) {
      toast({
        title: "Stake failed",
        description: error.message || "Failed to stake tokens",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdraw amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await withdraw(withdrawAmount)
      toast({
        title: "Withdrawal successful",
        description: `Successfully withdrew ${withdrawAmount} tokens`,
      })
      setWithdrawAmount("")
      await loadData()
    } catch (error: any) {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Failed to withdraw tokens",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyWithdraw = async () => {
    setIsLoading(true)
    try {
      await emergencyWithdraw()
      toast({
        title: "Emergency withdrawal successful",
        description: "Successfully performed emergency withdrawal",
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: "Emergency withdrawal failed",
        description: error.message || "Failed to perform emergency withdrawal",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimRewards = async () => {
    setIsLoading(true)
    try {
      await claimRewards()
      toast({
        title: "Rewards claimed",
        description: "Successfully claimed your rewards",
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: "Claim failed",
        description: error.message || "Failed to claim rewards",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setMaxStake = () => {
    if (tokenInfo) {
      setStakeAmount(tokenInfo.balance)
    }
  }

  const setMaxWithdraw = () => {
    if (userStakeInfo) {
      setWithdrawAmount(userStakeInfo.stakedAmount)
    }
  }

  if (!isConnected) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Connect your wallet to start staking</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Coins className="h-5 w-5 text-primary" />
          Staking Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stake" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stake">Stake</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="stake" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stake-amount">Stake Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={setMaxStake} disabled={!tokenInfo}>
                  Max
                </Button>
              </div>
              {tokenInfo && (
                <p className="text-sm text-muted-foreground">
                  Balance: {Number.parseFloat(tokenInfo.balance).toFixed(4)} {tokenInfo.symbol}
                </p>
              )}
            </div>
            <Button onClick={handleStake} disabled={isLoading || !stakeAmount} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Staking...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Stake Tokens
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Withdraw Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={setMaxWithdraw} disabled={!userStakeInfo}>
                  Max
                </Button>
              </div>
              {userStakeInfo && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Staked: {Number.parseFloat(userStakeInfo.stakedAmount).toFixed(4)} tokens
                  </p>
                  {!userStakeInfo.canWithdraw && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <p className="text-sm text-amber-600">
                        Unlock in: {Math.ceil(userStakeInfo.timeUntilUnlock / 3600)} hours
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawAmount || !userStakeInfo?.canWithdraw}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Withdrawing...
                </>
              ) : (
                "Withdraw Tokens"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Rewards</span>
                <Badge variant="secondary">
                  {userStakeInfo ? Number.parseFloat(userStakeInfo.pendingRewards).toFixed(6) : "0.000000"} tokens
                </Badge>
              </div>
            </div>
            <Button
              onClick={handleClaimRewards}
              disabled={
                isLoading || !userStakeInfo?.pendingRewards || Number.parseFloat(userStakeInfo.pendingRewards) === 0
              }
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Claiming...
                </>
              ) : (
                "Claim Rewards"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Emergency withdrawal will incur a penalty fee and forfeit all pending rewards. Use only in urgent
                situations.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleEmergencyWithdraw}
              disabled={
                isLoading || !userStakeInfo?.stakedAmount || Number.parseFloat(userStakeInfo.stakedAmount) === 0
              }
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Emergency Withdraw
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

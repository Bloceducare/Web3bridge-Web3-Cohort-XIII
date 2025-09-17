import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStaking } from '../hooks/useStaking'
import { ArrowUp, ArrowDown, Gift, AlertCircle } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function MinimalStaking3() {
  const [stakeAmount, setStakeAmount] = useState('')
  const {
    userStake,
    pendingRewards,
    totalStaked,
    rewardRate,
    unlockTime,
    stake,
    withdraw,
    claimRewards,
    emergencyWithdraw,
    isTransacting,
    isConnected
  } = useStaking()

  // Helper to safely parse numbers and fallback to 0
  const safeNumber = (value: any, decimals = 2) => {
    const num = parseFloat(value)
    return isNaN(num) ? (0).toFixed(decimals) : num.toFixed(decimals)
  }

  const calculateAPR = () => {
    const apr = parseFloat(rewardRate)
    return isNaN(apr) ? '0.0' : (apr * 100).toFixed(1)
  }

  const formatTimeRemaining = () => {
    const now = Date.now()
    const remaining = unlockTime - now
    if (remaining <= 0) return "Ready"
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    return `${days}d`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Connect Wallet - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ConnectButton />
      </div>
      
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-sm space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">gOV Staking</h1>
            <p className="text-sm text-muted-foreground">Simple and secure</p>
          </div>

          {/* Main Card */}
          <Card className="border-2">
            <CardContent className="p-6 space-y-6">
              
              {/* Balance Display */}
              <div className="text-center space-y-1">
                <p className="text-3xl font-bold">{safeNumber(userStake, 2)}</p>
                <p className="text-sm text-muted-foreground">gOV Staked</p>
              </div>

              {/* Quick Stats */}
              <div className="flex justify-between text-sm">
                <div className="text-center">
                  <p className="font-medium text-success">{safeNumber(pendingRewards, 4)}</p>
                  <p className="text-muted-foreground">Rewards</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{calculateAPR()}%</p>
                  <p className="text-muted-foreground">APR</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{formatTimeRemaining()}</p>
                  <p className="text-muted-foreground">Unlock</p>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                {/* Stake Input */}
                <Input
                  type="number"
                  placeholder="Amount to stake"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="h-11 text-center"
                />
                
                <Button
                  onClick={() => stake(stakeAmount)}
                  disabled={!isConnected || !stakeAmount || isTransacting}
                  className="w-full"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  {isTransacting ? 'Processing...' : 'Stake'}
                </Button>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={claimRewards}
                    disabled={!isConnected || parseFloat(pendingRewards) <= 0 || isTransacting}
                    variant="outline"
                    size="sm"
                  >
                    <Gift className="h-3 w-3 mr-1" />
                    Claim
                  </Button>
                  
                  <Button
                    onClick={()=> withdraw(userStake)}
                    disabled={!isConnected || parseFloat(userStake) <= 0 || formatTimeRemaining() !== "Ready" || isTransacting}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowDown className="h-3 w-3 mr-1" />
                    Withdraw
                  </Button>
                </div>

                <Button
                  onClick={emergencyWithdraw}
                  disabled={!isConnected || parseFloat(userStake) <= 0 || isTransacting}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Emergency Exit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p>{safeNumber(totalStaked, 2)} gOV total staked</p>
          </div>
        </div>
      </div>
    </div>
  )
}
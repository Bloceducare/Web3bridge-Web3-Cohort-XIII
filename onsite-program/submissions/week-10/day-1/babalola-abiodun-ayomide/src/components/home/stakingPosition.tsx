import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wallet, Gift, Clock, AlertTriangle } from 'lucide-react'
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS,  } from '@/constants'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'sonner'


export default function StakingPosition() {
  const { address, isConnected } = useAccount()

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const handleClaimRewards = async () => {
    if (!address) return
    try {
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: 'claimRewards',
        account: address,
      })
      toast("Your reward claim has been submitted")
    } catch (error) {
      toast("Failed to claim rewards")
      console.log(error)  
    }
  }

  const handleEmergencyWithdraw = async () => {
    if (!address) return
    try {
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: 'emergencyWithdraw',
        account: address,
      })
      toast("Emergency withdrawal has been submitted")
    } catch (error) {
      toast("Failed to emergency withdraw")
        console.log(error);   
    }
  }


  const stakeAmount = 0;
  const rewardAmount = 0;

  return (
    <Card className="bg-gradient-secondary shadow-card">
      <CardHeader className="pb-4 py-2 rounded bg-gray-100 shadow mx-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center shadow-glow-primary">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Your Position</CardTitle>
              <CardDescription>
                Current staking position and rewards
              </CardDescription>
            </div>
          </div>
          {Number(stakeAmount) > 0 && (
            <Badge className="bg-success/10 text-success border-success/20">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        { isConnected && Number(stakeAmount) > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Staked Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  {Number(stakeAmount).toFixed(4)} ETH
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pending Rewards</p>
                <p className="text-2xl font-bold text-success">
                  {Number(rewardAmount).toFixed(6)} ETH
                </p>
              </div>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Staked since: {new Date(Date.now()-1000).toLocaleDateString()}

                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleClaimRewards}
                  disabled={rewardAmount === 0 || isPending || isConfirming}
                  className="bg-success hover:bg-success/90 text-success-foreground transition-smooth"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Claim Rewards
                </Button>
                <Button
                  onClick={handleEmergencyWithdraw}
                  disabled={isPending || isConfirming}
                  variant="outline"
                  className="border-warning/20 text-warning hover:bg-warning/10 transition-smooth"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Emergency Exit
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/10 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">No Active Stakes</p>
            <p className="text-sm text-muted-foreground">
              Start staking to earn rewards and build your position
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
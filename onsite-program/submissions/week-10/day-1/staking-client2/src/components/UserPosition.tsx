import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useUserData } from '../hooks/useUserData';
import { useStaking } from '../hooks/useStaking';
import { formatTokenAmount, formatTimeRemaining } from '../utils/formatting';
import { Clock, Coins, TrendingUp } from 'lucide-react';

export function UserPosition() {
  const { stakedAmount, pendingRewards, timeUntilUnlock, canWithdraw, isLoading } = useUserData();
  const { claimRewards, isPending } = useStaking();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasStake = parseFloat(stakedAmount) > 0;
  const hasRewards = parseFloat(pendingRewards) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Your Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              Staked Amount
            </div>
            <p className="text-2xl font-bold">
              {formatTokenAmount(stakedAmount)} MTK
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Pending Rewards
            </div>
            <p className="text-xl font-semibold text-green-600">
              {formatTokenAmount(pendingRewards)} MTK
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Status
            </div>
            <p className={`text-sm font-medium ${canWithdraw ? 'text-green-600' : 'text-orange-600'}`}>
              {canWithdraw ? 'Unlocked' : formatTimeRemaining(timeUntilUnlock)}
            </p>
          </div>
        </div>

        {hasStake && (
          <div className="pt-4 border-t">
            <Button 
              onClick={claimRewards}
              disabled={isPending || !hasRewards}
              className="w-full"
              variant={hasRewards ? "default" : "outline"}
            >
              {hasRewards ? 'Claim Rewards' : 'No Rewards Available'}
              {isPending && '...'}
            </Button>
          </div>
        )}

        {!hasStake && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              No active stake position. Start staking to earn rewards!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
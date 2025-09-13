import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useStaking } from '../hooks/useStaking';
import { useUserData } from '../hooks/useUserData';
import { formatTokenAmount } from '../utils/formatting';
import { AlertTriangle, Shield } from 'lucide-react';

export function EmergencyWithdraw() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { emergencyWithdraw, isPending } = useStaking();
  const { stakedAmount, isLoading } = useUserData();

  const hasStake = parseFloat(stakedAmount) > 0;
  const penaltyAmount = hasStake ? (parseFloat(stakedAmount) * 0.5).toFixed(4) : '0';
  const receiveAmount = hasStake ? (parseFloat(stakedAmount) * 0.5).toFixed(4) : '0';

  const handleEmergencyWithdraw = async () => {
    await emergencyWithdraw();
    setShowConfirmation(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Emergency Withdraw
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Emergency Withdraw
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-destructive/10 p-4 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-destructive mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                Emergency Withdrawal Warning
              </p>
              <p className="text-sm text-muted-foreground">
                Emergency withdrawal incurs a 50% penalty. Only use this in urgent situations.
              </p>
            </div>
          </div>

          {hasStake && (
            <div className="space-y-2 pt-2 border-t border-destructive/20">
              <div className="flex justify-between text-sm">
                <span>Current Stake:</span>
                <span className="font-medium">{formatTokenAmount(stakedAmount)} MTK</span>
              </div>
              <div className="flex justify-between text-sm text-destructive">
                <span>Penalty (50%):</span>
                <span className="font-medium">-{formatTokenAmount(penaltyAmount)} MTK</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>You'll Receive:</span>
                <span className="text-green-600">{formatTokenAmount(receiveAmount)} MTK</span>
              </div>
            </div>
          )}
        </div>

        {!showConfirmation ? (
          <Button 
            onClick={() => setShowConfirmation(true)}
            disabled={!hasStake}
            variant="destructive"
            className="w-full"
          >
            {hasStake ? 'Emergency Withdraw' : 'No Stake to Withdraw'}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center font-medium">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                className="flex-1"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEmergencyWithdraw}
                variant="destructive"
                className="flex-1"
                disabled={isPending}
              >
                Confirm Withdraw
                {isPending && '...'}
              </Button>
            </div>
          </div>
        )}

        {!hasStake && (
          <p className="text-sm text-muted-foreground text-center">
            No active stake position to withdraw from
          </p>
        )}
      </CardContent>
    </Card>
  );
}
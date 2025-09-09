import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useStaking } from '../hooks/useStaking';
import { useTokenApproval } from '../hooks/useTokenApproval';
import { useUserData } from '../hooks/useUserData';
import { formatTokenAmount } from '../utils/formatting';

export function StakingForm() {
  const [stakeAmount, setStakeAmount] = useState('');
  
  const { stake, isPending: isStaking } = useStaking();
  const { approveToken, isApproving } = useTokenApproval();
  const { tokenBalance, allowance } = useUserData();

  const needsApproval = stakeAmount && parseFloat(allowance) < parseFloat(stakeAmount);
  const hasInsufficientBalance = stakeAmount && parseFloat(tokenBalance) < parseFloat(stakeAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stakeAmount) return;

    if (needsApproval) {
      await approveToken(stakeAmount);
    } else {
      await stake(stakeAmount);
      setStakeAmount('');
    }
  };

  const setMaxAmount = () => {
    setStakeAmount(tokenBalance);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stake Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stake-amount">Amount to Stake</Label>
            <div className="flex space-x-2">
              <Input
                id="stake-amount"
                type="number"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                step="0.000001"
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                onClick={setMaxAmount}
                disabled={!tokenBalance || parseFloat(tokenBalance) === 0}
              >
                Max
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Balance: {formatTokenAmount(tokenBalance)} MTK
            </p>
            {hasInsufficientBalance && (
              <p className="text-sm text-destructive">
                Insufficient balance
              </p>
            )}
          </div>

          <Button 
            type="submit"
            disabled={
              isStaking || 
              isApproving || 
              !stakeAmount || 
              hasInsufficientBalance ||
              parseFloat(stakeAmount) <= 0
            }
            className="w-full"
          >
            {needsApproval ? 'Approve Tokens' : 'Stake Tokens'}
            {(isStaking || isApproving) && '...'}
          </Button>

          {needsApproval && (
            <p className="text-sm text-muted-foreground">
              You need to approve tokens before staking
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const StakingForm = ({ 
  isConnected, 
  stakeAmount, 
  setStakeAmount, 
  handleApprove, 
  handleStake, 
  isStakingPending 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stake Tokens</CardTitle>
        <CardDescription>Enter amount to stake</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="stake">Amount</Label>
            <Input
              id="stake"
              type="number"
              placeholder="0.0"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleApprove}
              className="w-full"
              disabled={!isConnected || isStakingPending || !stakeAmount}
            >
              {!isConnected ? 'Connect Wallet' : isStakingPending ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              onClick={handleStake}
              className="w-full"
              disabled={!isConnected || isStakingPending || !stakeAmount}
            >
              {!isConnected ? 'Connect Wallet' : isStakingPending ? 'Staking...' : 'Stake'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StakingForm;

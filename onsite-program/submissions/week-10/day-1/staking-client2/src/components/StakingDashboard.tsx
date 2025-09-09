import { useAccount } from 'wagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { StakingForm } from './StakingForm';
import { UserPosition } from './UserPosition';
import { WithdrawForm } from './WithdrawForm';
import { EmergencyWithdraw } from './EmergencyWithdraw';
import { ProtocolStats } from './ProtocolStats';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

export function StakingDashboard() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6" />
              Connect Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Connect your wallet to start staking and earning rewards
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
        
        {/* Show protocol stats even when not connected */}
        <div className="w-full max-w-2xl">
          <ProtocolStats />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Protocol Overview */}
      <ProtocolStats />

      {/* Main Dashboard */}
      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="position">Position</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StakingForm />
            <UserPosition />
          </div>
        </TabsContent>

        <TabsContent value="position" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserPosition />
            <Card>
              <CardHeader>
                <CardTitle>Staking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lock Period:</span>
                    <span className="font-medium">1 Day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reward Calculation:</span>
                    <span className="font-medium">Per Minute</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Emergency Penalty:</span>
                    <span className="font-medium text-destructive">50%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">How it works:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Stake tokens to earn dynamic APR rewards</li>
                    <li>• APR starts at 250% and decreases with TVL</li>
                    <li>• Rewards calculated per minute</li>
                    <li>• Minimum 1-day lock period</li>
                    <li>• Claim rewards anytime</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="withdraw" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WithdrawForm />
            <UserPosition />
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmergencyWithdraw />
            <UserPosition />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
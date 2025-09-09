import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  AlertTriangle, 
  ArrowUpCircle,
  ArrowDownCircle,
  Shield,
  Loader2,
  CheckCircle,
  Info
} from 'lucide-react';
import { useContractData } from '@/hooks/useContractData';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { useStake } from '@/hooks/useStake';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useClaimRewards } from '@/hooks/useClaimRewards';
import { useEmergencyWithdraw } from '@/hooks/useEmergencyWithdraw';
import { formatTokenAmount, formatAPR, formatTimeRemaining } from '@/utils/formatters';

export default function StakingDashboard() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
  const [isEmergencySubmitting, setIsEmergencySubmitting] = useState(false);

  const {
    userDetails,
    totalStaked,
    initialApr,
    tokenSymbol,
    tokenBalance,
    allowance,
    refetchUserDetails,
    refetchBalance,
    refetchAllowance,
  } = useContractData();

const { approveToken, needsApproval, isPending: isApprovePending } = useTokenApproval();


const { stake, isPending: isStakePending, error: stakeError } = useStake();

 
const { withdraw, isPending: isWithdrawPending, error: withdrawError } = useWithdraw();


const { claimRewards, isPending: isClaimPending, error: claimError } = useClaimRewards();

 
const {
    emergencyWithdraw,
    isPending: isEmergencyPending,
    error: emergencyError,
  } = useEmergencyWithdraw();

 
const isAnyPending = isStakePending || isWithdrawPending || isClaimPending || isEmergencyPending || isApprovePending;


  useEffect(() => {
    const error = stakeError || withdrawError || claimError || emergencyError;
    if (error) {
      setMessage(`Error: ${error.message || 'Transaction failed'}`);
      setTimeout(() => setMessage(''), 5000);
    }
  }, [stakeError, withdrawError, claimError, emergencyError]);

  const handleStake = async () => {
    if (!stakeAmount) {
      setMessage('Please enter a stake amount');
      return;
    }
    

    if (!tokenBalance || tokenBalance.value === 0n) {
      setMessage('You need STA tokens to stake. Your balance is 0.');
      return;
    }
    
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      
      if (needsApproval(stakeAmount, allowance)) {
        setMessage('Approving tokens...');
        await approveToken(stakeAmount);
        setMessage('Tokens approved. Now staking...');
      
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setMessage('Staking tokens...');
      await stake(stakeAmount);
setMessage('Stake confirmed');
      setStakeAmount('');
      await Promise.all([refetchUserDetails(), refetchBalance(), refetchAllowance()]);
      
    } catch (err) {
      console.error('Staking error:', err);
      setMessage(`Error: ${err.shortMessage || err.message || 'Transaction failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) {
      setMessage('Please enter a withdrawal amount');
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }
    
    if (userDetails && amount > parseFloat(formatTokenAmount(userDetails.stakedAmount))) {
      setMessage('Cannot withdraw more than staked amount');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
await withdraw(withdrawAmount);
      setMessage('Withdraw confirmed');
      setWithdrawAmount('');
      await Promise.all([refetchUserDetails(), refetchBalance(), refetchAllowance()]);
    } catch (err) {
      console.error('Withdrawal error:', err);
      setMessage(`Error: ${err.shortMessage || err.message || 'Failed to withdraw'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
await claimRewards();
      setMessage('Rewards claimed');
      await Promise.all([refetchUserDetails(), refetchBalance(), refetchAllowance()]);
    } catch (err) {
      console.error('Claim rewards error:', err);
      setMessage(`Error: ${err.shortMessage || err.message || 'Failed to claim rewards'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyWithdraw = async () => {
    setIsEmergencySubmitting(true);
    setIsLoading(true);
    setMessage('');

    try {
      await emergencyWithdraw();
      setMessage('Emergency withdraw confirmed');
      await Promise.all([refetchUserDetails(), refetchBalance(), refetchAllowance()]);
      setIsEmergencyDialogOpen(false);
    } catch (err) {
      setMessage(`Error: ${err.shortMessage || err.message || 'Failed to emergency withdraw'}`);
    } finally {
      setIsEmergencySubmitting(false);
      setIsLoading(false);
    }
  };

  const setMaxStake = () => {
    if (tokenBalance) {
      setStakeAmount(formatTokenAmount(tokenBalance.value));
    }
  };

  const setMaxWithdraw = () => {
    if (userDetails && userDetails.stakedAmount) {
      setWithdrawAmount(formatTokenAmount(userDetails.stakedAmount));
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Staking Protocol
            </h1>
         
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Message Display */}
        {message && (
          <Card className={`border ${
            message.includes('Error') ? 'border-red-500 bg-red-50' : 
            message.includes('success') || message.includes('confirmed') ? 'border-green-500 bg-green-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <CardContent className="flex items-center gap-2 pt-4">
              {message.includes('Error') ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : message.includes('success') || message.includes('confirmed') ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Info className="h-4 w-4 text-blue-500" />
              )}
              <span className={`text-sm ${
                message.includes('Error') ? 'text-red-700' :
                message.includes('success') || message.includes('confirmed') ? 'text-green-700' :
                'text-blue-700'
              }`}>
                {message}
              </span>
            </CardContent>
          </Card>
        )}


        {/* Protocol Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatTokenAmount(totalStaked)} {tokenSymbol}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current APR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatAPR(initialApr)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{tokenBalance ? formatTokenAmount(tokenBalance.value) : '0'} {tokenSymbol}</p>
              {(!tokenBalance || tokenBalance.value === 0n) && (
                <div className="text-xs text-orange-600 mt-1">
                  <p>⚠️ You need {tokenSymbol} tokens to stake.</p>
                  <p className="mt-1 font-mono text-xs break-all">
                    Token: {import.meta.env.VITE_STAKING_TOKEN}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Position */}
        {userDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Your Staking Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Staked Amount</p>
                  <p className="text-lg font-semibold">{formatTokenAmount(userDetails.stakedAmount)} {tokenSymbol}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Rewards</p>
                  <p className="text-lg font-semibold">{formatTokenAmount(userDetails.pendingRewards)} {tokenSymbol}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lock Status</p>
<p className="text-lg font-semibold">
                    {userDetails.canWithdraw
                      ? 'Unlocked'
                      : `Locked (${formatTimeRemaining(Number(userDetails.timeUntilUnlock))})`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Staking Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5" />
                Stake Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount to Stake</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={setMaxStake}>
                    Max
                  </Button>
                </div>
              </div>

              <Button 
                variant="default" 
                className="w-full" 
                disabled={!stakeAmount || isLoading || isAnyPending || (!tokenBalance || tokenBalance.value === 0n)}
                onClick={handleStake}
              >
                {isLoading || isAnyPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLoading ? 'Processing...' : 'Confirming...'}
                  </>
                ) : (!tokenBalance || tokenBalance.value === 0n) ? (
                  'Need Tokens to Stake'
                ) : !stakeAmount ? (
                  'Enter Amount to Stake'
                ) : (
                  'Stake Tokens'
                )}
              </Button>

            
            </CardContent>
          </Card>

          {/* Withdrawal Section */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5" />
                Withdraw
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="default" 
                className="w-full"
                disabled={(!userDetails?.pendingRewards || userDetails.pendingRewards === 0n) || isLoading || isAnyPending}
                onClick={handleClaimRewards}
              >
                {isLoading || isAnyPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Claim Rewards (${userDetails ? formatTokenAmount(userDetails.pendingRewards) : '0'} ${tokenSymbol})`
                )}
              </Button>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount to Withdraw</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={setMaxWithdraw}>
                    Max
                  </Button>
                </div>
              </div>

              <Button 
                variant="secondary" 
                className="w-full"
                disabled={!withdrawAmount || !userDetails?.canWithdraw || isLoading || isAnyPending}
                onClick={handleWithdraw}
              >
                {isLoading || isAnyPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : userDetails?.canWithdraw ? (
                  'Withdraw'
                ) : (
                  'Locked - Cannot Withdraw Yet'
                )}
              </Button>


            </CardContent>
          </Card>
        </div>

        {/* Emergency Section - ALWAYS VISIBLE */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h3 className="font-medium text-destructive mb-1">Emergency Withdrawal</h3>
                  <p className="text-sm text-muted-foreground">
                    Immediately withdraw all staked tokens. This action will forfeit all pending rewards 
                    and may incur a penalty fee. Only use in emergency situations.
                  </p>
                </div>
              </div>
            </div>
            
            <AlertDialog
              open={isEmergencyDialogOpen}
              onOpenChange={(open) => {
                if (!isEmergencySubmitting) setIsEmergencyDialogOpen(open);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full md:w-auto bg-red-600 text-white hover:bg-red-700"
                  disabled={isLoading || isAnyPending || !userDetails || userDetails.stakedAmount === 0n}
                >
                  {isLoading || isAnyPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Emergency Withdraw All'
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader className="text-left">
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Confirm Emergency Withdrawal
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-neutral-700 dark:text-neutral-300">
                    This will immediately withdraw all your staked tokens.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3">
                  <div className="rounded-md border p-3 text-sm bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600/40">
                    <p className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warning
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-red-800 dark:text-red-200">
                      <li>All pending rewards will be forfeited</li>
                      <li>A penalty fee may be applied</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>

                  {userDetails && (
                    <div className="rounded-md border p-3 text-sm bg-gray-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-300">You will withdraw</span>
                        <span className="font-medium">
                          {formatTokenAmount(userDetails.stakedAmount)} {tokenSymbol}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isEmergencySubmitting}>Cancel</AlertDialogCancel>
                  <Button
                    type="button"
                    onClick={handleEmergencyWithdraw}
                    disabled={isEmergencySubmitting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isEmergencySubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      'Yes, Emergency Withdraw All'
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

       
      </div>
    </div>
  );
}
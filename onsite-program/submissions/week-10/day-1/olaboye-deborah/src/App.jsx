import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import Header from './components/Header';
import UserPosition from './components/UserPosition';
import StakingForm from './components/StakingForm';
import WithdrawForm from './components/WithdrawForm';
import RewardsClaim from './components/RewardsClaim';
import ProtocolStats from './components/ProtocolStats';
import EmergencyWithdraw from './components/EmergencyWithdraw';
import { stakingAbi } from './config/ABI';
import { erc20Abi } from './config/ERC20';
import { Toaster, toast } from 'sonner';

const CONTRACT_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138';
const TOKEN_ADDRESS = '0x71b7ebee9dcd3cb69650eeb20537d555c948977d';

function App() {
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Fetch staking token address
  const { data: stakingToken } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'stakingToken',
  });

  // Fetch user details
  const { data: userDetails } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'getUserDetails',
    args: [address],
    enabled: !!address,
  });
  
  // Parse user details from the struct
  const stakedBalance = userDetails?.stakedAmount || 0n;
  const pendingRewards = userDetails?.pendingRewards || 0n;
  const timeUntilUnlock = userDetails?.timeUntilUnlock || 0;
  const canWithdraw = userDetails?.canWithdraw || false;
  
  // Alternative individual reads as fallback
  const { data: userInfo } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'userInfo',
    args: [address],
    enabled: !!address && !userDetails,
  });
  
  const { data: pendingRewardsAlt } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'getPendingRewards',
    args: [address],
    enabled: !!address && !userDetails,
  });
  
  const { data: timeUntilUnlockAlt } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'getTimeUntilUnlock',
    args: [address],
    enabled: !!address && !userDetails,
  });
  
  // Use fallback data if getUserDetails doesn't work
  const finalStakedBalance = stakedBalance || (userInfo?.[0] || 0n);
  const finalPendingRewards = pendingRewards || (pendingRewardsAlt || 0n);
  const finalTimeUntilUnlock = timeUntilUnlock || (timeUntilUnlockAlt ? Math.max(0, Number(timeUntilUnlockAlt) - Date.now() / 1000) : 0);
  const finalCanWithdraw = canWithdraw || (finalTimeUntilUnlock <= 0);

  // Fetch protocol data
  const { data: apr } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'initialApr',
  });
  const { data: currentRewardRate } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'currentRewardRate',
  });
  const { data: totalStaked } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'totalStaked',
  });
  const { data: totalRewards } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: stakingAbi,
    functionName: 'getTotalRewards',
  });

  // Write transactions
  const { writeContract, error: writeError } = useWriteContract();
  const { isPending: isStakingPending } = useWaitForTransactionReceipt({ hash: writeContract.data?.hash });

  // Approve token
  const handleApprove = () => {
    if (!isConnected) {
      toast({ title: 'Please connect your wallet first!' });
      return;
    }
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'error' });
      return;
    }
    writeContract({
      address: stakingToken || TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, parseEther(stakeAmount)],
    });
    toast({ title: 'Approval initiated!' });
  };

  // Stake tokens
  const handleStake = () => {
    if (!isConnected) {
      toast({ title: 'Please connect your wallet first!' });
      return;
    }
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'error' });
      return;
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: stakingAbi,
      functionName: 'stake',
      args: [parseEther(stakeAmount)],
    });
    toast({ title: 'Staking initiated!' });
    setStakeAmount('');
  };

  // Withdraw tokens
  const handleWithdraw = () => {
    if (!isConnected) {
      toast({ title: 'Please connect your wallet first!' });
      return;
    }
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'error' });
      return;
    }
    if (!finalCanWithdraw) {
      toast({ title: 'Error', description: 'Lock duration not met', variant: 'error' });
      return;
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: stakingAbi,
      functionName: 'withdraw',
      args: [parseEther(withdrawAmount)],
    });
    toast({ title: 'Withdrawal initiated!' });
    setWithdrawAmount('');
  };

  // Claim rewards
  const handleClaim = () => {
    if (!isConnected) {
      toast({ title: 'Please connect your wallet first!' });
      return;
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: stakingAbi,
      functionName: 'claimRewards',
    });
    toast({ title: 'Rewards claim initiated!' });
  };

  // Emergency withdraw
  const handleEmergencyWithdraw = () => {
    if (!isConnected) {
      toast({ title: 'Please connect your wallet first!' });
      return;
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: stakingAbi,
      functionName: 'emergencyWithdraw',
    });
    toast({ title: 'Emergency withdrawal initiated!' });
  };

  // Log errors
  if (writeError) {
    console.error('Transaction error:', writeError);
    toast({ title: 'Error', description: writeError.message, variant: 'error' });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isConnected={isConnected} address={address} />

      <div className="container mx-auto space-y-6 py-8">
        {!isConnected && (
          <Card className="w-[400px] mx-auto">
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>Connect to start staking</CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectButton />
            </CardContent>
          </Card>
        )}

        <UserPosition 
          isConnected={isConnected}
          stakedBalance={finalStakedBalance}
          pendingRewards={finalPendingRewards}
          timeUntilUnlock={finalTimeUntilUnlock}
        />

        {isConnected && (
          <>

            <StakingForm 
              isConnected={isConnected}
              stakeAmount={stakeAmount}
              setStakeAmount={setStakeAmount}
              handleApprove={handleApprove}
              handleStake={handleStake}
              isStakingPending={isStakingPending}
            />

            <WithdrawForm 
              isConnected={isConnected}
              withdrawAmount={withdrawAmount}
              setWithdrawAmount={setWithdrawAmount}
              handleWithdraw={handleWithdraw}
              canWithdraw={finalCanWithdraw}
            />

            <RewardsClaim 
              isConnected={isConnected}
              pendingRewards={finalPendingRewards}
              handleClaim={handleClaim}
            />

            <EmergencyWithdraw 
              isConnected={isConnected}
              handleEmergencyWithdraw={handleEmergencyWithdraw}
            />

          </>
        )}
        
        <ProtocolStats 
          apr={apr}
          totalStaked={totalStaked}
          totalRewards={totalRewards}
          currentRewardRate={currentRewardRate}
        />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
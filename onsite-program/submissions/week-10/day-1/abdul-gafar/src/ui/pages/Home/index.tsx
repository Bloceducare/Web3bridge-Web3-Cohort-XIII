'use client';

import React from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import { useAccount } from 'wagmi';
import StatsCard from '@/ui/modules/components/StatsCard';
import StakingCard from '@/ui/modules/components/StackingCard';
import WithdrawCard from '@/ui/modules/components/WithdrawalCard';
import PositionCard from '@/ui/modules/components/PositionCard';
import RewardsCard from '@/ui/modules/components/RewardCard';
import { AppLayout } from '@/ui/modules/partials';
import { useGetContractBalance, useGetInitialApr, useGetUserStake } from '@/common/hooks';
import { formatEther } from 'viem';
import useClaimRewards from '@/common/hooks/useClaimRewards';
import useStake from '@/common/hooks/useStaking';
import useWithdraw from '@/common/hooks/useWithdrawal';
import useEmergencyWithdraw from '@/common/hooks/useEmergencyWithdrawal';
import { formatTimestamp } from '@/common/utils/helpers';

export default function HomePage() {
  const theme = useTheme();
  const { isConnected } = useAccount();
  const balance = useGetContractBalance();
  const userStakeBalance = useGetUserStake();
  const contractApr = useGetInitialApr();
  const claimReward = useClaimRewards();
  const withdrawStake = useWithdraw();
  const emergencyWithdraw = useEmergencyWithdraw();
  const stake = useStake();
  // @ts-ignore
  const userstakedAmount = userStakeBalance ? formatEther(userStakeBalance.stakedAmount) : '0'
  if(balance) {
    console.log("Contract APR percentage", contractApr)
  }

  const mockData = {
    tokenBalance: userstakedAmount,
    // @ts-ignore
    stakedAmount: userstakedAmount,
    // @ts-ignore
    pendingRewards: userStakeBalance ? formatEther(userStakeBalance.pendingRewards) : '0',
    timeUntilUnlock: '432000',
    canWithdraw: false,
    // @ts-ignore
    currentApr: contractApr ? formatEther(contractApr) : '',
    // @ts-ignore
    totalStaked: userstakedAmount,
    totalStakers: '1,234',
    rewardPool: '50000.00',
    totalClaimed: '25.50',
    // @ts-ignore
    stakingDate: userStakeBalance ? formatTimestamp(userStakeBalance.stakedAmount) : '0',
  };

  return (
    <AppLayout>
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          pt: 4,
          pb: 8,
        }}
      >
        <Container maxWidth="xl">
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Stake & Earn
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Stake your tokens and earn dynamic rewards with our innovative APR system
            </Typography>
          </Box>

          {/* Stats Overview */}
          <Box sx={{ mb: 4 }}>
            <StatsCard
              totalStaked={mockData.totalStaked}
              currentApr={mockData.currentApr}
              totalStakers={mockData.totalStakers}
              rewardPool={mockData.rewardPool}
              isLoading={!isConnected}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={3}>
                <Grid size={12}>
                  <StakingCard
                    tokenBalance={isConnected ? mockData.tokenBalance : '0'}
                    currentApr={mockData.currentApr}
                    isLoading={false}
                    handleStake={stake}
                  />
                </Grid>
                <Grid size={12}>
                  <WithdrawCard
                    stakedAmount={isConnected ? mockData.stakedAmount : '0'}
                    timeUntilUnlock={isConnected ? mockData.timeUntilUnlock : '0'}
                    canWithdraw={isConnected ? mockData.canWithdraw : false}
                    isLoading={false}
                    handleWithdraw={withdrawStake}
                    handleEmergencyWithdraw={emergencyWithdraw}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 4}}>
              <Grid container spacing={3}>
                <Grid size={12}>
                  <PositionCard
                    stakedAmount={isConnected ? mockData.stakedAmount : '0'}
                    pendingRewards={isConnected ? mockData.pendingRewards : '0'}
                    timeUntilUnlock={isConnected ? mockData.timeUntilUnlock : '0'}
                    stakingDate={isConnected ? mockData.stakingDate : ''}
                    canWithdraw={isConnected ? mockData.canWithdraw : false}
                    isLoading={false}
                  />
                </Grid>
                <Grid size={12}>
                  <RewardsCard
                    pendingRewards={isConnected ? mockData.pendingRewards : '0'}
                    totalClaimed={isConnected ? mockData.totalClaimed : '0'}
                    isLoading={false}
                    handleClaim={claimReward}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {!isConnected && (
            <Paper
              elevation={0}
              sx={{
                mt: 4,
                p: 3,
                textAlign: 'center',
                background: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Connect Your Wallet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please connect your wallet to start staking and earning rewards
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </AppLayout>
  );
}

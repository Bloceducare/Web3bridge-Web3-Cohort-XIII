'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
  useTheme,
  Skeleton,
  LinearProgress,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

interface PositionCardProps {
  stakedAmount?: string;
  pendingRewards?: string;
  timeUntilUnlock?: string;
  stakingDate?: string;
  canWithdraw?: boolean;
  isLoading?: boolean;
}

export default function PositionCard({
  stakedAmount = '0',
  pendingRewards = '0',
  timeUntilUnlock = '0',
  stakingDate = '',
  canWithdraw = false,
  isLoading = false
}: PositionCardProps) {
  const theme = useTheme();

  const formatTimeRemaining = (seconds: string) => {
    const sec = parseInt(seconds);
    if (sec <= 0) return 'Unlocked';
    
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    
    if (days > 0) return `${days} days, ${hours} hours`;
    if (hours > 0) return `${hours} hours, ${minutes} minutes`;
    return `${minutes} minutes`;
  };

  const getLockProgress = () => {
    const totalLockTime = 30 * 24 * 60 * 60; // 30 days in seconds
    const timeRemaining = parseInt(timeUntilUnlock);
    const timePassed = totalLockTime - timeRemaining;
    return Math.min(100, Math.max(0, (timePassed / totalLockTime) * 100));
  };

  return (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountCircleIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={600}>
            Your Position
          </Typography>
          <Chip
            icon={canWithdraw ? <LockOpenIcon /> : <LockIcon />}
            label={canWithdraw ? 'Unlocked' : 'Locked'}
            size="small"
            color={canWithdraw ? 'success' : 'warning'}
            sx={{ ml: 'auto' }}
          />
        </Box>

        {parseFloat(stakedAmount) > 0 ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Staked Amount
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {isLoading ? <Skeleton width={100} /> : `${stakedAmount} STK`}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Pending Rewards
                </Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  {isLoading ? <Skeleton width={100} /> : `${pendingRewards} STK`}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Staking Date
                </Typography>
                <Typography variant="body1">
                  {isLoading ? <Skeleton width={100} /> : stakingDate || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Time Until Unlock
                </Typography>
                <Typography variant="body1" color={canWithdraw ? 'success.main' : 'text.primary'}>
                  {isLoading ? <Skeleton width={100} /> : formatTimeRemaining(timeUntilUnlock)}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Lock Progress
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getLockProgress().toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getLockProgress()}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 1,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                  },
                }}
              />
            </Box>
          </>
        ) : (
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              No active staking position
            </Typography>
            <Typography variant="caption">
              Stake tokens to start earning rewards
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
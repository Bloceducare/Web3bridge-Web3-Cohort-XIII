'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  Chip,
  alpha,
  useTheme,
  Skeleton,
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useAccount } from 'wagmi';

interface RewardsCardProps {
  pendingRewards?: string;
  totalClaimed?: string;
  isLoading?: boolean;
}

export default function RewardsCard({ 
  pendingRewards = '0', 
  totalClaimed = '0', 
  isLoading = false 
}: RewardsCardProps) {
  const theme = useTheme();
  const { isConnected } = useAccount();

  const handleClaim = () => {
    console.log('Claiming rewards:', pendingRewards);
  };

  return (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <MonetizationOnIcon sx={{ mr: 1.5, color: theme.palette.success.main }} />
          <Typography variant="h6" fontWeight={600}>
            Rewards
          </Typography>
          <Chip
            icon={<AutorenewIcon sx={{ '&.MuiChip-icon': { animation: 'spin 2s linear infinite' } }} />}
            label="Live"
            size="small"
            color="success"
            sx={{ 
              ml: 'auto',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
            mb: 3,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Pending Rewards
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: theme.palette.success.main }}>
            {isLoading ? <Skeleton width={120} /> : `${pendingRewards} STK`}
          </Typography>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ 
              mt: 2, 
              height: 2, 
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.success.main,
              }
            }} 
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Claimed
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {isLoading ? <Skeleton width={80} /> : `${totalClaimed} STK`}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Claimable Now
            </Typography>
            <Typography variant="body1" fontWeight={600} color="success.main">
              {isLoading ? <Skeleton width={80} /> : `${pendingRewards} STK`}
            </Typography>
          </Box>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleClaim}
          disabled={!isConnected || parseFloat(pendingRewards) <= 0 || isLoading}
          sx={{
            py: 1.5,
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.primary.dark} 100%)`,
            },
          }}
        >
          {!isConnected ? 'Connect Wallet' : 'Claim Rewards'}
        </Button>
      </CardContent>
    </Card>
  );
}

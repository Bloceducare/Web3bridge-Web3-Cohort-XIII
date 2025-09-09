'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  Slider,
  Chip,
  alpha,
  useTheme,
  Skeleton,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAccount } from 'wagmi';

interface StakingCardProps {
  tokenBalance?: string;
  currentApr?: string;
  isLoading?: boolean;
}

export default function StakingCard({ tokenBalance = '0', currentApr = '0', isLoading = false }: StakingCardProps) {
  const theme = useTheme();
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState(0);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setSliderValue(value);
    const balance = parseFloat(tokenBalance);
    setAmount((balance * value / 100).toFixed(4));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      const balance = parseFloat(tokenBalance);
      if (balance > 0) {
        setSliderValue((parseFloat(value || '0') / balance) * 100);
      }
    }
  };

  const handleMaxClick = () => {
    setAmount(tokenBalance);
    setSliderValue(100);
  };

  const handleStake = () => {
    // Will be implemented with contract integration
    console.log('Staking:', amount);
  };

  return (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        borderRadius: 3,
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUpIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={600}>
            Stake Tokens
          </Typography>
          <Chip
            label={isLoading ? <Skeleton width={60} /> : `APR: ${currentApr}%`}
            size="small"
            color="primary"
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Available Balance: {isLoading ? <Skeleton width={80} sx={{ display: 'inline-block' }} /> : `${tokenBalance} STK`}
          </Typography>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="0.0"
          value={amount}
          onChange={handleAmountChange}
          disabled={!isConnected || isLoading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  size="small"
                  onClick={handleMaxClick}
                  disabled={!isConnected || isLoading}
                  sx={{ minWidth: 'auto', mr: 1 }}
                >
                  MAX
                </Button>
                <Typography variant="body2" color="text.secondary">
                  STK
                </Typography>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ px: 1, mb: 3 }}>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={!isConnected || isLoading}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
            sx={{
              '& .MuiSlider-thumb': {
                backgroundColor: theme.palette.primary.main,
              },
              '& .MuiSlider-track': {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {['25%', '50%', '75%', '100%'].map((percentage) => (
            <Button
              key={percentage}
              size="small"
              variant="outlined"
              onClick={() => {
                const value = parseInt(percentage);
                setSliderValue(value);
                const balance = parseFloat(tokenBalance);
                setAmount((balance * value / 100).toFixed(4));
              }}
              disabled={!isConnected || isLoading}
              sx={{
                flex: 1,
                minWidth: 'auto',
                borderColor: alpha(theme.palette.primary.main, 0.3),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              {percentage}
            </Button>
          ))}
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <InfoOutlinedIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.info.main }} />
            <Typography variant="body2" fontWeight={500}>
              Staking Info
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            • Minimum lock period: 30 days<br />
            • Rewards calculated per minute<br />
            • APR decreases as total staked increases
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleStake}
          disabled={!isConnected || !amount || parseFloat(amount) <= 0 || isLoading}
          sx={{
            py: 1.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
            },
          }}
        >
          {!isConnected ? 'Connect Wallet' : 'Stake Tokens'}
        </Button>
      </CardContent>
    </Card>
  );
}

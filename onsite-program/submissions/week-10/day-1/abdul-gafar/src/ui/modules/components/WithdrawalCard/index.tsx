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
  Alert,
  Chip,
  alpha,
  useTheme,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAccount } from 'wagmi';

interface WithdrawCardProps {
  stakedAmount?: string;
  timeUntilUnlock?: string;
  canWithdraw?: boolean;
  isLoading?: boolean;
}

export default function WithdrawCard({ 
  stakedAmount = '0', 
  timeUntilUnlock = '0', 
  canWithdraw = false, 
  isLoading = false 
}: WithdrawCardProps) {
  const theme = useTheme();
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxClick = () => {
    setAmount(stakedAmount);
  };

  const handleWithdraw = () => {
    console.log('Withdrawing:', amount);
  };

  const handleEmergencyWithdraw = () => {
    console.log('Emergency withdraw');
    setEmergencyDialogOpen(false);
  };

  const formatTimeRemaining = (seconds: string) => {
    const sec = parseInt(seconds);
    if (sec <= 0) return 'Unlocked';
    
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AccountBalanceIcon sx={{ mr: 1.5, color: theme.palette.warning.main }} />
            <Typography variant="h6" fontWeight={600}>
              Withdraw
            </Typography>
            {!canWithdraw && timeUntilUnlock !== '0' && (
              <Chip
                icon={<AccessTimeIcon />}
                label={isLoading ? <Skeleton width={60} /> : formatTimeRemaining(timeUntilUnlock)}
                size="small"
                color="warning"
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Staked Amount: {isLoading ? <Skeleton width={80} sx={{ display: 'inline-block' }} /> : `${stakedAmount} STK`}
            </Typography>
          </Box>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="0.0"
            value={amount}
            onChange={handleAmountChange}
            disabled={!isConnected || !canWithdraw || isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleMaxClick}
                    disabled={!isConnected || !canWithdraw || isLoading}
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
            sx={{ mb: 3 }}
          />

          {!canWithdraw && timeUntilUnlock !== '0' && (
            <Alert 
              severity="warning" 
              icon={<AccessTimeIcon />}
              sx={{ mb: 3 }}
            >
              Your tokens are locked for {formatTimeRemaining(timeUntilUnlock)}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleWithdraw}
              disabled={!isConnected || !canWithdraw || !amount || parseFloat(amount) <= 0 || isLoading}
              sx={{ py: 1.5 }}
            >
              {!isConnected ? 'Connect Wallet' : canWithdraw ? 'Withdraw' : `Locked (${formatTimeRemaining(timeUntilUnlock)})`}
            </Button>

            <Button
              variant="outlined"
              size="large"
              color="error"
              onClick={() => setEmergencyDialogOpen(true)}
              disabled={!isConnected || parseFloat(stakedAmount) <= 0 || isLoading}
              sx={{ py: 1.5 }}
            >
              <WarningAmberIcon />
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            * Emergency withdrawal incurs a 10% penalty
          </Typography>
        </CardContent>
      </Card>

      <Dialog
        open={emergencyDialogOpen}
        onClose={() => setEmergencyDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningAmberIcon sx={{ mr: 1, color: theme.palette.error.main }} />
          Emergency Withdrawal
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Emergency withdrawal will incur a 10% penalty on your staked amount.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            You will receive: <strong>{(parseFloat(stakedAmount) * 0.9).toFixed(4)} STK</strong><br />
            Penalty: <strong>{(parseFloat(stakedAmount) * 0.1).toFixed(4)} STK</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEmergencyWithdraw} color="error" variant="contained">
            Confirm Emergency Withdrawal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

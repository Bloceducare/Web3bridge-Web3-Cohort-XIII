'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  useTheme,
  alpha,
} from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function Header() {
  const theme = useTheme();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AccountBalanceWalletIcon
              sx={{
                fontSize: 32,
                mr: 2,
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              StakeVault
            </Typography>
          </Box>
          <ConnectButton />
        </Toolbar>
      </Container>
    </AppBar>
  );
}

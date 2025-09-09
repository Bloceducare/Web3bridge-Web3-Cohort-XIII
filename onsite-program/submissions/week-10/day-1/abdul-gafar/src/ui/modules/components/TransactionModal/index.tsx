'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  status: 'pending' | 'success' | 'error';
  title?: string;
  message?: string;
  hash?: string;
  explorerUrl?: string;
}

export default function TransactionModal({
  open,
  onClose,
  status,
  title = 'Transaction',
  message,
  hash,
  explorerUrl,
}: TransactionModalProps) {
  const theme = useTheme();

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <CircularProgress size={60} />;
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 60, color: theme.palette.success.main }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 60, color: theme.palette.error.main }} />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return message || 'Transaction is being processed...';
      case 'success':
        return message || 'Transaction completed successfully!';
      case 'error':
        return message || 'Transaction failed. Please try again.';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={status !== 'pending' ? onClose : undefined}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minWidth: 400,
          background: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        {status !== 'pending' && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          {getStatusIcon()}
          <Typography variant="body1" sx={{ mt: 3, mb: 2 }}>
            {getStatusMessage()}
          </Typography>
          {hash && explorerUrl && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon />}
              href={`${explorerUrl}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 2 }}
            >
              View on Explorer
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

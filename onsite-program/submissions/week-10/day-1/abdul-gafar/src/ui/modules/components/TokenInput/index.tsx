'use client';

import React from 'react';
import {
  TextField,
  InputAdornment,
  Button,
  Typography,
  Box,
} from '@mui/material';

interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  maxValue?: string;
  disabled?: boolean;
  placeholder?: string;
  symbol?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
}

export default function TokenInput({
  value,
  onChange,
  maxValue,
  disabled = false,
  placeholder = '0.0',
  symbol = 'STK',
  label,
  error = false,
  helperText,
}: TokenInputProps) {
  const handleMaxClick = () => {
    if (maxValue) {
      onChange(maxValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (/^\d*\.?\d*$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <Box>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {maxValue && (
                <Button
                  size="small"
                  onClick={handleMaxClick}
                  disabled={disabled}
                  sx={{ minWidth: 'auto', mr: 1 }}
                >
                  MAX
                </Button>
              )}
              <Typography variant="body2" color="text.secondary">
                {symbol}
              </Typography>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
}

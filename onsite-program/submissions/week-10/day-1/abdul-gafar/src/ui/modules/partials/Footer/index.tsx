'use client';

import React from 'react';
import { Box, Container, Typography, Link, useTheme, alpha } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';

export default function Footer() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 3,
        px: 2,
        background: alpha(theme.palette.background.paper, 0.3),
        borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} StakeVault. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <GitHubIcon />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <TwitterIcon />
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

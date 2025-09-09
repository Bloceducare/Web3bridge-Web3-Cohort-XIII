'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Divider,
  alpha,
  useTheme,
  Skeleton,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

interface StatsCardProps {
  totalStaked?: string;
  currentApr?: string;
  totalStakers?: string;
  rewardPool?: string;
  isLoading?: boolean;
}

export default function StatsCard({ 
  totalStaked = '0',
  currentApr = '0',
  totalStakers = '0',
  rewardPool = '0',
  isLoading = false
}: StatsCardProps) {
  const theme = useTheme();

  const stats = [
    {
      label: 'Total Value Locked',
      value: `${totalStaked} STK`,
      icon: <AssessmentIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Current APR',
      value: `${currentApr}%`,
      icon: <TrendingUpIcon />,
      color: theme.palette.success.main,
    },
    {
      label: 'Total Stakers',
      value: totalStakers,
      icon: <GroupIcon />,
      color: theme.palette.info.main,
    },
    {
      label: 'Reward Pool',
      value: `${rewardPool} STK`,
      icon: <LocalFireDepartmentIcon />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Card
      elevation={0}
      sx={{
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Protocol Statistics
        </Typography>
        
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={index}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: alpha(stat.color, 0.1),
                      color: stat.color,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {isLoading ? <Skeleton width={100} /> : stat.value}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {index < stats.length - 1 && index % 2 === 1 && (
                <Divider sx={{ mt: 3, display: { xs: 'block', sm: 'none' } }} />
              )}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

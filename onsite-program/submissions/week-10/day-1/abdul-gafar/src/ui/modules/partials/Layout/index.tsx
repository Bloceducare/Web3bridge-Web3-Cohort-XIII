'use client';
import Stack from '@mui/material/Stack';
import Header from '../Header';
import Footer from '../Footer';
import { ReactNode } from 'react';

type AppLayoutProps = {
  children: ReactNode;
}

export function AppLayout({
  children
}: AppLayoutProps) {
  return (
    <Stack>
      <Header />
      {children}
      <Footer />
    </Stack>
  )
}

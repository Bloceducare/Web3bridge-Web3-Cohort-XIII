import type { Metadata } from "next";
import "./globals.css";
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: "Staking DApp",
  description: "Web3 Staking DApp on Sepolia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

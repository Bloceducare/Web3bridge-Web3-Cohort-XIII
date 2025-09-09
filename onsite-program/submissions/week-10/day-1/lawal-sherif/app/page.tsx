"use client";

import { WalletConnect } from "@/components/wallet-connect";
import { UserStats } from "@/components/user-stats";
import { ProtocolStats } from "@/components/protocol-stats";
import { StakingForm } from "@/components/staking-form";
import { Toaster } from "@/components/ui/toaster";
import { STAKING_CONTRACT_ADDRESS } from "@/lib/contract";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance text-foreground">
              DeFi Staking Protocol
            </h1>
            <p className="text-muted-foreground mt-1">
              Stake your tokens and earn rewards with our secure staking
              protocol
            </p>
          </div>
          <WalletConnect />
        </div>

        {/* Protocol Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Protocol Overview
          </h2>
          <ProtocolStats />
        </div>

        {/* User Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Your Position
          </h2>
          <UserStats />
        </div>

        {/* Staking Form */}
        <div className="max-w-2xl mx-auto">
          <StakingForm />
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mt-1">
              Contract Address:{" "}
              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                {STAKING_CONTRACT_ADDRESS}
              </code>
            </p>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}

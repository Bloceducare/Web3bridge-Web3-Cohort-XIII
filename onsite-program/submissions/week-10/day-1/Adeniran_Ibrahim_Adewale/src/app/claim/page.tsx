"use client";

import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useStaking } from "@/hooks/useStaking"

export default function ClaimPage() {
  const { claimRewards } = useStaking()

  const handleClaimRewards = async () => {
    try {
      await claimRewards()
      alert("Rewards claimed successfully!")
    } catch (error) {
      console.error(error)
      alert("Failed to claim rewards.")
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Claim Your Rewards</h1>
            <Button onClick={handleClaimRewards}>Claim Rewards</Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

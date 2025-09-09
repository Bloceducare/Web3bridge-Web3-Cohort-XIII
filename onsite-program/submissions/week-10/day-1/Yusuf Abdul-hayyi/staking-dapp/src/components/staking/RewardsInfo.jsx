import { useEffect } from "react";
import useStaking from "../../hooks/useStaking";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { toast } from "sonner";

export default function RewardsInfo() {
  const { pendingRewards, currentApr, isLoadingRewards, refreshRewards } = useStaking();

  useEffect(() => {
    refreshRewards().catch((err) => {
      console.error("Failed to fetch rewards:", err);
      toast.error("Failed to fetch rewards");
    });
  }, [refreshRewards]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rewards Info</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingRewards ? (
          <p className="animate-pulse text-gray-500">Loading rewards...</p>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Current APR</span>
              <span className="font-medium">{currentApr ? `${currentApr}%` : "—"}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Pending Rewards</span>
              <span className="font-medium">{pendingRewards?.toString() ?? "0"}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

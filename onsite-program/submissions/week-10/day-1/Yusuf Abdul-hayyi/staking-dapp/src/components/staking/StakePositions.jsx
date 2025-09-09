import { useEffect } from "react";
import useStaking from "../../hooks/useStaking";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { toast } from "sonner";

export default function StakePositions() {
  const {
    totalStaked,
    userStakes,
    unlockTimes,
    isLoadingPositions,
    refreshPositions,
  } = useStaking();

  useEffect(() => {
    refreshPositions().catch((err) => {
      console.error("Failed to fetch positions:", err);
      toast.error("Failed to fetch stake positions");
    });
  }, [refreshPositions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Staking Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingPositions ? (
          <p className="animate-pulse text-gray-500">Loading positions...</p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              <p className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Total Staked</span>
                <span className="font-medium">{totalStaked?.toString() ?? "0"}</span>
              </p>
            </div>

            {userStakes?.length ? (
              <ul className="space-y-2">
                {userStakes.map((stake, i) => (
                  <li key={i} className="rounded-md border p-3 text-sm flex items-center justify-between">
                    <span className="font-medium">{stake.amount.toString()} tokens</span>
                    <span className="text-zinc-600">
                      Unlock: {Number(unlockTimes[i]) > 0 ? new Date(Number(unlockTimes[i]) * 1000).toLocaleString() : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No active stakes</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { toast } from "sonner";
import useClaimRewards from "../../hooks/useClaimRewards";
import { Button } from "../ui/button";
import useStaking from "../../hooks/useStaking";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

export default function ClaimRewards() {
  const claimRewards = useClaimRewards();
  const { pendingRewards, userStakedAmount } = useStaking();
  const { isConnected } = useAccount();

  const handleClaim = async () => {
    try {
      await claimRewards();
    } catch (err) {
      console.error("Claim failed:", err);
      // toast handled inside hook based on receipt
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎁 Claim Rewards</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleClaim} size="sm" className="w-auto" disabled={!isConnected || userStakedAmount === 0n || (pendingRewards ?? 0n) === 0n}>Claim</Button>
      </CardContent>
    </Card>
  );
}

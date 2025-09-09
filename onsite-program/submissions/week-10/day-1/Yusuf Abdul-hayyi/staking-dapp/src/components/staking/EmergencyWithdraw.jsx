import { toast } from "sonner";
import useEmergencyWithdraw from "../../hooks/useEmergencyWithdraw";
import { Button } from "../ui/button";
import useStaking from "../../hooks/useStaking";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

export default function EmergencyWithdraw() {
  const { emergencyWithdraw } = useEmergencyWithdraw();
  const { userStakedAmount, emergencyPenaltyPercent } = useStaking();
  const { isConnected } = useAccount();

  const handleEmergency = async () => {
    try {
      await emergencyWithdraw();
      toast.success("Emergency withdrawal complete", {
        description: "Funds have been withdrawn immediately",
      });
    } catch (err) {
      console.error("Emergency withdraw failed:", err);
      toast.error("Emergency failed", {
        description: err?.shortMessage || err?.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Withdraw</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-600 mb-3">
          This will withdraw funds immediately and forfeit {Number(emergencyPenaltyPercent)}% of staked amount.
        </p>
        <Button onClick={handleEmergency} variant="destructive" size="sm" className="w-auto" disabled={!isConnected || userStakedAmount === 0n}>
          Emergency Withdraw
        </Button>
      </CardContent>
    </Card>
  );
}

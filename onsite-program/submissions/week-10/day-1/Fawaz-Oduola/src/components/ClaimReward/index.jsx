import useClaimReward from "../../hooks/useClaimReward";
import { Button } from "../ui/button";
import { toast } from "sonner";

function ClaimReward() {
  const { claim, status } = useClaimReward();

  const handleClaim = () => {
    if (status !== "success") {
      toast.error("Wallet not Connected");
      return;
    }
    claim();
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold">Rewards</h2>
      <p className="text-sm text-gray-500">Claim your accumulated rewards.</p>
      <Button onClick={handleClaim}>Claim Reward</Button>
    </div>
  );
}

export default ClaimReward;

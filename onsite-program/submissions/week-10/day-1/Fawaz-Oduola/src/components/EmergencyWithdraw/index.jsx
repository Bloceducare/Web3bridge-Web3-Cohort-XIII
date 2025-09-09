import { Button } from "../ui/button";
import { toast } from "sonner";
import useEmergencyWithdraw from "../../hooks/useEmergencyWithdrawal";

function EmergencyWithdraw() {
  const { emergencyWithdraw, status } = useEmergencyWithdraw();

  const handleEmergencyWithdraw = () => {
    if (status !== "success") {
      toast.error("Wallet not Connected");
      return;
    }
    emergencyWithdraw();
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4 border border-red-200">
      <h2 className="text-lg font-semibold text-red-600">Emergency Withdraw</h2>
      <p className="text-sm text-gray-500">
        Use only if you need to immediately withdraw all staked tokens.
      </p>
      <Button variant="destructive" onClick={handleEmergencyWithdraw}>
        Emergency Withdraw
      </Button>
    </div>
  );
}

export default EmergencyWithdraw;

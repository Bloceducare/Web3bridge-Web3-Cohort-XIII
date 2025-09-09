import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import type { UserDetails } from "@/hooks/useGetUserDetails";
import { formatUnits } from "viem";

export const EmergencyWithdrawToken = ({
  position,
  penalty = 10,
}: {
  position: UserDetails;
  penalty?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const stakedAmount = formatUnits(position?.stakedAmount ?? 0n, 18);

  const penaltyAmount = (
    (parseFloat(stakedAmount) * penalty) /
    100
  ).toFixed(2);
  const receiveAmount = (
    parseFloat(stakedAmount) - parseFloat(penaltyAmount)
  ).toFixed(2);

  const handleEmergencyWithdraw = () => {
    // onEmergencyWithdraw(position.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Emergency
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Emergency Withdrawal
          </DialogTitle>
          <DialogDescription>
            This will withdraw your entire stake with a {penalty}% penalty.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Staked Amount:</span>
              <span>{stakedAmount} MTK</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Penalty ({penalty}%):</span>
              <span>-{penaltyAmount} MTK</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>You'll receive:</span>
              <span>{receiveAmount} MTK</span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ This action cannot be undone. You'll lose {penalty}% of your
              staked amount.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleEmergencyWithdraw}>
            Confirm Emergency Withdrawal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

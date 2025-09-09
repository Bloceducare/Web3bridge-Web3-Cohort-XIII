import { useState } from "react";
import { toast } from "sonner";
import useUnstakeTokens from "../../hooks/useUnstakeTokens";
import { Button } from "../ui/button";
import useStaking from "../../hooks/useStaking";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

export default function Withdrawn() {
  const [amount, setAmount] = useState("");
  const { withdraw } = useUnstakeTokens();
  const { userStakedAmount, unlockTimes } = useStaking();
  const { isConnected } = useAccount();
  const isUnlocked = unlockTimes && unlockTimes.length > 0 ? Math.floor(Date.now() / 1000) >= Number(unlockTimes[0]) : false;

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Invalid amount", { description: "Enter a valid token amount" });
      return;
    }
    try {
      await withdraw(amount);
    } catch (err) {
      console.error("Withdraw failed:", err);
      // toast handled inside hook based on receipt
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button
            onClick={handleWithdraw}
            size="sm"
            className="w-auto"
            disabled={!isConnected || !amount || userStakedAmount === 0n || !isUnlocked}
          >
            Withdraw
          </Button>
          {!isUnlocked && (
            <p className="text-xs text-zinc-500">Your stake is still locked. Please wait until unlock time.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

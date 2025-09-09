import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useStake from "../../hooks/useStake";
import { toast } from "sonner";
import { useState } from "react";

export function StakingForm() {
  const { stake, status } = useStake();
  const [amount, setAmount] = useState("");

  const handleStake = () => {
    if (status !== "success") {
      toast.error("Wallet not Connected");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    stake(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold">Stake Tokens</h2>
      <p className="text-sm text-gray-500">Enter the amount you want to stake.</p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button onClick={handleStake}>Stake</Button>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import useWithdraw from "../../hooks/useWithdraw";

export function Withdraw() {
  const { withdraw, status } = useWithdraw();
  const [amount, setAmount] = useState("");

  const handleWithdraw = () => {
    if (status !== "success") {
      toast.error("Wallet not Connected");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    withdraw(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold">Withdraw Tokens</h2>
      <p className="text-sm text-gray-500">Withdraw a portion of your staked tokens.</p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button onClick={handleWithdraw}>Withdraw</Button>
      </div>
    </div>
  );
}

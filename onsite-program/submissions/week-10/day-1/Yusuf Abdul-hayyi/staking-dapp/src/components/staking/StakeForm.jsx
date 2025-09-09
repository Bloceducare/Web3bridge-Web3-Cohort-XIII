import { useState } from "react";
import { toast } from "sonner";
import useStakeTokens from "../../hooks/useStakeTokens";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

export default function StakeForm() {
  const [amount, setAmount] = useState("");
  const { stake } = useStakeTokens();

  const handleStake = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Invalid amount", { description: "Enter a valid token amount" });
      return;
    }

    try {
      await stake(amount);
      setAmount("");
    } catch (err) {
      console.error("Stake failed:", err);
      // toast handled inside hook based on receipt
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stake Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleStake} className="space-y-4">
          <div>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" disabled={!amount} size="sm" className="w-auto">
            Stake
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

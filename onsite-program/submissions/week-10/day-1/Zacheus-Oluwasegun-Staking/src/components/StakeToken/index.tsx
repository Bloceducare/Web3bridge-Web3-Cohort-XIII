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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins } from "lucide-react";
import useStakeTokenStore from "@/config/store";
import useStakeToken from "@/hooks/useStakeToken";

export const StakeToken = () => {
  const [amount, setAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const tokenSymbol = useStakeTokenStore((state) => state.tokenSymbol);
  const onStake = useStakeToken();

  const handleStake = () => {
    if (amount && parseFloat(amount) > 0) {
      onStake(amount);
      // setAmount("");
      // setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="">
          <Coins className="mr-2 h-4 w-4" />
          Stake Tokens
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Stake {tokenSymbol} Tokens</DialogTitle>
          <DialogDescription>
            Enter the amount of {tokenSymbol} tokens you want to stake.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              className="col-span-3"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleStake}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Stake Tokens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

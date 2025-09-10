//import { AppWindowIcon, CodeIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useWithdraw from "@/hooks/useWithdraw";
import useEmergencyWithdraw from "@/hooks/useEmergencyWithdraw";

function Withdraw() {
  const [withdrawAmount, setWithdrawAmount] = React.useState("");

  const withdraw = useWithdraw();
  const emergencyWithdraw = useEmergencyWithdraw();
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Withdraw Your Token
          </CardTitle>
          <CardDescription className="text-md text-center font-bold">
            You can withdraw your staked token
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="tabs-demo-name" className="text-md font-bold">
              Amount of token to withdraw
            </Label>
            <Input
              id="tabs-demo-name"
              placeholder="Enter token amount"
              className="h-10 py-6"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() => withdraw(withdrawAmount)}
            className="w-1/2 h-12 bg-purple-400 text-white text-lg font-bold hover:bg-purple-500"
          >
            Withdraw
          </Button>
          <Button
            onClick={() => emergencyWithdraw()}
            className="w-1/2 h-12 bg-red-600 text-white text-lg font-bold hover:bg-red-700"
          >
            Emergency Withdraw
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Withdraw;

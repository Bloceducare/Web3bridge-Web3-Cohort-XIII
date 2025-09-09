//import { AppWindowIcon, CodeIcon } from "lucide-react";

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

function RewardClaim() {
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
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button className="w-1/2 h-12 bg-purple-400 text-white text-lg font-bold hover:bg-purple-500">
            Withdraw
          </Button>
          <Button className="w-1/2 h-12 bg-purple-600 text-white text-lg font-bold hover:bg-purple-700">
            Emergency Withdraw
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default RewardClaim;

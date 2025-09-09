//import { AppWindowIcon, CodeIcon } from "lucide-react"
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
import useStake from "@/hooks/useStake";

function Stake() {
  const [stakeToken, setStakeToken] = React.useState("");

  const stake = useStake();

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Stake Your Token
          </CardTitle>
          <CardDescription className="text-md text-center font-bold">
            You can stake your token to enjoy a good return
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="tabs-demo-name" className="text-md font-bold">
              Amount of token to stake
            </Label>
            <Input
              id="tabs-demo-name"
              placeholder="Enter token amount"
              className="h-10 py-6"
              value={stakeToken}
              onChange={(e) => setStakeToken(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full h-12 bg-purple-400 text-white text-lg font-bold hover:bg-purple-500"
            onClick={() => stake(stakeToken)}
          >
            Stake
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Stake;

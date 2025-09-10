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
import { Label } from "@/components/ui/label";
import useClaimReward from "@/hooks/useClaimReward";
import useStakingBalance from "@/hooks/useStakingBalance";

function RewardClaim() {
  const { pendingRewards } = useStakingBalance();
  const claimReward = useClaimReward();
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Claim Reward</CardTitle>
          <CardDescription className="text-md text-center font-bold">
            You can claim your staked token rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3 items-center justify-center ">
            <Label
              htmlFor="tabs-demo-name"
              className="text-md font-bold text-center text-3xl"
            >
              {pendingRewards}
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() => claimReward()}
            className="w-full h-12 bg-purple-600 text-white text-lg font-bold hover:bg-purple-700"
          >
            Claim Reward
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default RewardClaim;

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useGetUserDetails, { type UserDetails } from "@/hooks/useGetUserDetails";
import { formatUnits } from "viem";
import { AlertTriangle, Coins, Loader2 } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";
import { WithdrawToken } from "../WithdrawToken/WithdrawToken";
import useClaimRewards from "@/hooks/useClaimRewards";
import { EmergencyWithdrawToken } from "../WithdrawToken/EmergencyWithdrawToken";
import { useAccount } from "wagmi";

export const UserPositionCard = () => {
  const {userDetails, isLoading} = useGetUserDetails();
  const {address} = useAccount()
  // const tokenSymbol = useStakeTokenStore(state => state.tokenSymbol)
  const position = userDetails;
  const pendingRewards = Number(
    formatUnits(position?.pendingRewards ?? 0n, 18)
  ).toFixed(5);
  const onClaimRewards = useClaimRewards()
  console.log({position})

  if (!address) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Connect Wallet to see staking position</p>
        </CardContent>
      </Card>
    );
  }

  if (formatUnits(position?.stakedAmount ?? 0n, 18) === "0" && !isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Coins className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No staking position found</p>
        </CardContent>
      </Card>
    );
  }
  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-spin" />
          <p className="text-gray-600 mb-4">Loading position...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {formatUnits(position?.stakedAmount ?? 0n, 18)} MST
            </CardTitle>
            <CardDescription>Staked on </CardDescription>
          </div>
          <Badge variant={position?.canWithdraw ? "default" : "secondary"}>
            {position?.canWithdraw ? "Unlocked" : "Locked"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Pending Rewards</p>
            <p className="font-semibold">{pendingRewards} MST</p>
          </div>
          <div>
            <p className="text-gray-600">Unlock Status</p>
            <p className="font-semibold">
              {formatTimeRemaining(Number(position?.timeUntilUnlock))}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onClaimRewards}
            disabled={Number(pendingRewards) <= 0 || !position?.canWithdraw}
            className="w-full"
          >
            Claim Rewards ({pendingRewards} MST)
          </Button>

          <div className="grid grid-cols-1 gap-2">
            <WithdrawToken position={position as UserDetails} />
            <EmergencyWithdrawToken 
              position={position as UserDetails}               
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

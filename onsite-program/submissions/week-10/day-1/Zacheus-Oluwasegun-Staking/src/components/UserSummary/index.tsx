import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export const UserSummaryCard = ({ userData }: { userData: any }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Your Staking Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Total Staked</p>
            <p className="text-2xl font-bold">{userData.totalStaked} MTK</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Pending Rewards</p>
            <p className="text-2xl font-bold text-green-600">
              {userData.pendingRewards} MTK
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Positions</p>
            <p className="text-2xl font-bold">{userData.positions.length}</p>
          </div>
        </div>

        <Button
          onClick={()=>{}}
          disabled={parseFloat(userData.pendingRewards) <= 0}
          className="w-full md:w-auto"
        >
          Claim All Rewards ({userData.pendingRewards} MTK)
        </Button>
      </CardContent>
    </Card>
  );
};

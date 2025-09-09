import { Coins, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import useStakeTokenStore from "@/config/store";
import useGetStakingStats from "@/hooks/useGetStakingStats";

export const ContractStats = () => {
  const {totalStaked, currentAPR} = useGetStakingStats();
  const tokenSymbol = useStakeTokenStore((state) => state.tokenSymbol);

  const stats = [
    {
      title: "Total Staked",
      value: `${Number(totalStaked)} ${tokenSymbol}`,
      icon: <Coins className="h-4 w-4" />,
      color: "text-blue-600",
    },
    {
      title: "Current APR",
      value: `${currentAPR}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-600",
    }, 
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="flex items-center p-6">
            <div className={`${stat.color} mr-4`}>{stat.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

import React from "react";
import useProtocolStats from "../../hooks/useProtocolStatistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEther } from "viem";

function ProtocolStats() {
  const protocolStats = useProtocolStats();

  if (!protocolStats) return null;

  const stats = [
    {
      label: "Total Staked",
      value: `${formatEther(protocolStats.totalStaked)} STT`,
    },
    {
      label: "Total Rewards",
      value: `${Number(formatEther(protocolStats.totalRewards)).toFixed(5)} STT`,
    },
    {
      label: "Current APR",
      value: `${protocolStats.currentAPR.toString()} %`,
    },
    {
      label: "Reward Rate",
      value: `${protocolStats.currentRewardRate.toString()} / sec`,
    },
    {
      label: "Min Lock Duration",
      value: `${protocolStats.minLockDuration.toString()} sec`,
    },
    {
      label: "APR Reduction / 1000",
      value: `${protocolStats.aprReductionPerThousand.toString()} %`,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <h2 className="text-lg font-semibold">Protocol Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item, i) => (
          <Card
            key={i}
            className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-gray-900">
              {item.value}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ProtocolStats;

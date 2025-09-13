import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { formatTokenAmount, formatApr } from '../utils/formatting';
import { BarChart3, TrendingUp, Clock, DollarSign } from 'lucide-react';

export function ProtocolStats() {
  const { totalStaked, currentRewardRate, initialApr, minLockDuration, isLoading } = useProtocolStats();

  const formatLockDuration = (seconds: string): string => {
    const days = Math.floor(parseInt(seconds) / (24 * 3600));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocol Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Value Locked',
      value: `${formatTokenAmount(totalStaked)} MTK`,
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'Current APR',
      value: formatApr(currentRewardRate),
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Initial APR',
      value: formatApr(initialApr),
      icon: BarChart3,
      color: 'text-purple-600'
    },
    {
      title: 'Lock Duration',
      value: formatLockDuration(minLockDuration),
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {stat.title}
                </div>
                <p className={`text-lg font-semibold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• APR decreases by 0.5% for every 1,000 tokens staked</p>
            <p>• Minimum APR is capped at 10%</p>
            <p>• Emergency withdrawal incurs 50% penalty</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
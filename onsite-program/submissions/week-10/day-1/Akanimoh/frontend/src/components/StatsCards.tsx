import { FaChartLine, FaCoins, FaPercentage, FaUsers } from 'react-icons/fa';
import { useContractStats, useUserStakeDetails, useTokenBalance } from '../hooks/useStaking';
import { formatEther } from 'viem';

export function StatsCards() {
  const { totalStaked, formattedTotalStaked, formattedApr, isLoading: statsLoading } = useContractStats();
  const { userDetails, isLoading: userLoading } = useUserStakeDetails();
  const { formattedBalance } = useTokenBalance();

  const userStakedAmount = userDetails?.stakedAmount ?? 0n;
  const userPendingRewards = userDetails?.pendingRewards ?? 0n;

  const stats = [
    {
      title: 'Your Wallet Balance',
      value: `${formattedBalance} STK`,
      icon: FaCoins,
      color: 'from-blue-500 to-blue-600',
      loading: false,
    },
    {
      title: 'Your Staked Amount',
      value: `${formatEther(userStakedAmount)} STK`,
      icon: FaChartLine,
      color: 'from-green-500 to-green-600',
      loading: userLoading,
    },
    {
      title: 'Your Pending Rewards',
      value: `${formatEther(userPendingRewards)} STK`,
      icon: FaCoins,
      color: 'from-purple-500 to-purple-600',
      loading: userLoading,
    },
    {
      title: 'Current APR',
      value: formattedApr,
      icon: FaPercentage,
      color: 'from-primary-pink to-primary-blue',
      loading: statsLoading,
    },
    {
      title: 'Total Staked (Protocol)',
      value: `${formattedTotalStaked} STK`,
      icon: FaUsers,
      color: 'from-orange-500 to-red-500',
      loading: statsLoading,
    },
    {
      title: 'Your Share',
      value: totalStaked && userStakedAmount > 0n 
        ? `${((Number(formatEther(userStakedAmount)) / Number(formattedTotalStaked)) * 100).toFixed(2)}%`
        : '0%',
      icon: FaChartLine,
      color: 'from-teal-500 to-cyan-500',
      loading: statsLoading || userLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 bg-gradient-to-r ${stat.color} rounded-lg`}>
                  <stat.icon className="text-white text-lg" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {stat.loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                ) : (
                  stat.value
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

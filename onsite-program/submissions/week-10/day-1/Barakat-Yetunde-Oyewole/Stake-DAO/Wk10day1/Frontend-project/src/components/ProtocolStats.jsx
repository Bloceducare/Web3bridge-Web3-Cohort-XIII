import React from 'react';
import { useStakingData } from '../hooks/useContracts';
import { formatTokenAmount, calculateAPR } from '../utils';

/**
 * ProtocolStats component - Shows overall statistics about the staking protocol
 * This displays data that's relevant to all users, not specific to one wallet
 */
const ProtocolStats = () => {
  // Get protocol-wide statistics from our custom hook
  const { protocolStats } = useStakingData();

  // Define the statistics we want to display
  const stats = [
    {
      label: 'Total Value Locked', // How much is staked across all users
      value: `${formatTokenAmount(protocolStats.totalStaked)} Tokens`,
      icon: '', // Lock emoji represents "locked" staked tokens
      bgColor: 'bg-blue-50', // Light blue background
      textColor: 'text-blue-700', // Darker blue text
    },
    {
      label: 'Current APR', // Annual Percentage Rate - how much rewards you earn per year
      value: `${calculateAPR(protocolStats.currentRewardRate)}%`,
      icon: '', // Chart emoji represents growth/returns
      bgColor: 'bg-green-50', // Light green background  
      textColor: 'text-green-700', // Darker green text
    },
    {
      label: 'Reward Rate', // Raw reward rate in basis points (technical detail)
      value: `${protocolStats.currentRewardRate.toString()} BP`, // BP = Basis Points
      icon: '', // Lightning bolt represents active/dynamic rate
      bgColor: 'bg-purple-50', // Light purple background
      textColor: 'text-purple-700', // Darker purple text
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Loop through each statistic and render a card */}
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} rounded-xl p-6 border-2 border-opacity-20`}
        >
          <div className="flex items-center">
            {/* Icon */}
            <div className="text-2xl mr-3">{stat.icon}</div>
            
            {/* Text content */}
            <div>
              {/* Label (smaller, gray text) */}
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              
              {/* Value (large, colored text) */}
              <p className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProtocolStats;
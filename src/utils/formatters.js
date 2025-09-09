import { formatEther } from 'viem';

export const formatTokenAmount = (amount, decimals = 4) => {
  if (!amount) return '0';
  const formatted = formatEther(amount);
  return Number(formatted).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};


export const formatAPR = (aprBasisPoints) => {
  if (!aprBasisPoints) return '0%';
 
  const percentage = Number(aprBasisPoints) / 100;
  return `${percentage.toFixed(2)}%`;
};


export const formatTimeRemaining = (seconds) => {
  if (!seconds || seconds <= 0) return 'Unlocked';
  
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const formatDate = (timestamp) => {
  if (!timestamp) return 'Never';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};


export const sanitizeAmount = (value) => {
  if (!value || isNaN(value)) return '';
  const num = parseFloat(value);
  if (num < 0) return '';
  return num.toString();
};


export const isValidAmount = (amount) => {
  if (!amount) return false;
  const num = parseFloat(amount);
  return num > 0 && !isNaN(num);
};

export function formatTimestamp(timestamp: bigint): string {
  if (!timestamp || timestamp === 0n) return 'Never';
  
  const date = new Date(Number(timestamp));
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toISOString().split('T')[0];
}
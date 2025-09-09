'use client';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useStaking } from "@/hooks/useStaking"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function PositionTable() {
  const { address } = useAccount();
  
  const { positions, isLoading, error, refreshPositions } = useStaking({
    onStaked: (position) => {
      console.log('New position staked:', position);
    },
    onWithdrawn: (positionId) => {
      console.log('Position withdrawn:', positionId);
    },
    onError: (err) => {
      console.error('Staking error:', err);
    },
  });

  // Refresh positions when account changes
  useEffect(() => {
    if (address) {
      refreshPositions();
    }
  }, [address, refreshPositions]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading positions: {error.message}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refreshPositions()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const totalStaked = positions.reduce((sum, pos) => sum + BigInt(pos.amount), BigInt(0));
  const totalRewards = positions.reduce((sum, pos) => sum + BigInt(pos.reward), BigInt(0));

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>
          {positions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No staking positions found</p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span>Your staking positions</span>
              <Button variant="outline" size="sm" onClick={refreshPositions}>
                Refresh
              </Button>
            </div>
          )}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Rewards</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell className="font-mono text-xs">
                {`${position.id.slice(0, 6)}...${position.id.slice(-4)}`}
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  position.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : position.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {position.status}
                </span>
              </TableCell>
              <TableCell>{formatEther(BigInt(position.amount))} ETH</TableCell>
              <TableCell>{formatEther(BigInt(position.reward))} ETH</TableCell>
              <TableCell>{formatDate(position.startTime)}</TableCell>
              <TableCell>{formatDate(position.endTime)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {positions.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-medium">Total</TableCell>
              <TableCell>{formatEther(totalStaked)} ETH</TableCell>
              <TableCell>+{formatEther(totalRewards)} ETH</TableCell>
              <TableCell colSpan={2} className="text-right">
                <span className="font-medium">
                  {formatEther(totalStaked + totalRewards)} ETH
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
  
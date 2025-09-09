import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { BarChart3, ExternalLink, Users, TrendingUp } from 'lucide-react'

interface UserInfo{ 
 address: string,
    amount: string,
    rewards: string,
    timestamp: string,
    status: string
}
const mockStakes:UserInfo[] = [
  {
    address: '0x1234...5678',
    amount: '12.5',
    rewards: '0.847',
    timestamp: '2024-01-15',
    status: 'Active'
  },
  {
    address: '0x8765...4321',
    amount: '25.0',
    rewards: '1.692',
    timestamp: '2024-01-10',
    status: 'Active'
  },
  {
    address: '0xabcd...efgh',
    amount: '8.75',
    rewards: '0.523',
    timestamp: '2024-01-20',
    status: 'Active'
  },
  {
    address: '0x9876...1234',
    amount: '50.0',
    rewards: '3.125',
    timestamp: '2024-01-05',
    status: 'Active'
  },
  {
    address: '0x5555...aaaa',
    amount: '15.25',
    rewards: '0.987',
    timestamp: '2024-01-18',
    status: 'Active'
  }
]

export default function AllStakes() {
  const totalStakers = mockStakes.length
  const totalStaked = mockStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0)
  const totalRewards = mockStakes.reduce((sum, stake) => sum + parseFloat(stake.rewards), 0)

  return (
    <Card className="bg-gradient-secondary border-border shadow-card">
      <CardHeader className="py-2 rounded bg-gray-100 shadow mx-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center shadow-glow-primary">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div >
              <CardTitle className="text-xl">All Stake Positions</CardTitle>
              <CardDescription>
                View all active staking positions across the protocol
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-success/10 text-success border-success/20 shadow-lg">
            {totalStakers} Active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 ">
        <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-gradient-accent border border-border/50 shadow-md bg-gray-50">
          <div className="text-center border rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Stakers</span>
            </div>
            <p className="text-lg font-bold text-foreground">{totalStakers}</p>
          </div>
          <div className="text-center  bg-gray-100 border rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Staked</span>
            </div>
            <p className="text-lg font-bold text-foreground">{totalStaked.toFixed(2)} RSK</p>
          </div>
          <div className="text-center  bg-gray-100 border rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-muted-foreground">Total Rewards</span>
            </div>
            <p className="text-lg font-bold text-success">{totalRewards.toFixed(3)} RSK</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 hover:bg-muted/10 border-border/50">
                <TableHead className="text-muted-foreground font-medium">Address</TableHead>
                <TableHead className="text-muted-foreground font-medium">Staked</TableHead>
                <TableHead className="text-muted-foreground font-medium">Rewards</TableHead>
                <TableHead className="text-muted-foreground font-medium">Since</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStakes.map((stake, index) => (
                <TableRow key={index} className="border-border/30 hover:bg-muted/5 transition-smooth">
                  <TableCell className="font-mono text-sm">
                    {stake.address}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {stake.amount} RSK
                  </TableCell>
                  <TableCell className="text-success font-semibold">
                    {stake.rewards} RSK
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(stake.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-success/10 text-success border-success/20 text-xs">
                      {stake.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(``, '_blank')}
                      className="hover:bg-muted/10 transition-smooth"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {mockStakes.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">No Stakes Yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to stake and earn rewards
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
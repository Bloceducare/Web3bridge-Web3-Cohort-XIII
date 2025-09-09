"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { formatUnits } from "viem"

import { useStaking } from "@/hooks/useStaking"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const { positions } = useStaking()
  const totalStaked = positions.reduce(
    (acc, pos) => acc + BigInt(pos.amount),
    BigInt(0)
  )
  const totalRewards = positions.reduce(
    (acc, pos) => acc + BigInt(pos.reward),
    BigInt(0)
  )

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Staked</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatUnits(totalStaked, 18)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Badge variant="outline">
            <IconTrendingUp />
            +12.5%
          </Badge>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Rewards</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatUnits(totalRewards, 18)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Badge variant="outline">
            <IconTrendingDown />
            -20%
          </Badge>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current APR</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            5%
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Badge variant="outline">
            <IconTrendingUp />
            +12.5%
          </Badge>
        </CardFooter>
      </Card>
    </div>
  )
}

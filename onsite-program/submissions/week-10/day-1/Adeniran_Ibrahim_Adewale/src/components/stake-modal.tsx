"use client"

import { useState } from "react"
import { parseUnits } from "viem"

import { useStaking } from "@/hooks/useStaking"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function StakeModal() {
  const [amount, setAmount] = useState("")
  const { stake, approve } = useStaking()

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.")
      return
    }
    try {
      const parsedAmount = parseUnits(amount, 18)
      await approve(parsedAmount.toString())
      await stake(parsedAmount.toString())
      alert("Staked successfully!")
    } catch (error) {
      console.error(error)
      alert("Failed to stake.")
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Stake</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Stake Tokens</DialogTitle>
          <DialogDescription>
            Enter the amount of tokens you want to stake.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              type="number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleStake}>Stake</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

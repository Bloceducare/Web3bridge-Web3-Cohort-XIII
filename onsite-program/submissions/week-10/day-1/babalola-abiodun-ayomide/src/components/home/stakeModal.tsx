import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Label } from "@radix-ui/react-label"
import { Input } from "../ui/input"
import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Coins, TrendingUp, X } from "lucide-react"
import { useAccount } from "wagmi"
import { useBalance } from "../hooks/useBalance"
import { toast } from "sonner"
import { useApproveAndStakeToken } from "../hooks/useApproval"


export default function StakeModal({ setOpen }: { setOpen: () => void }) {
    const [stakeValue, setStakeValue] = useState<number>(0);
    const { isConnected } = useAccount();
    const { tokenBalance } = useBalance();
    const { approve } = useApproveAndStakeToken(stakeValue);

    const [loading, setLoading] = useState(false)
    return (
        <Dialog open>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
                <DialogHeader className="relative">
                    <DialogTitle className="sr-only">Stake ETH</DialogTitle>
                    <button
                        onClick={setOpen}
                        className="absolute right-3 top-3 rounded-[50%] hover:bg-muted"
                    >
                        <X onClick={setOpen} className="w-2 h-2 text-red-500 p-5 relative  rounded-[50%] hover:bg-red-300 flex text " />
                    </button>
                </DialogHeader>
                <Card className="bg-gradient-secondary border-border shadow-card border-none rounded-none">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-primary">
                                <Coins className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Stake RSK</CardTitle>
                                <CardDescription>
                                    Stake your RSK tokens and earn rewards
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm font-medium">
                                Amount (RSK)
                            </Label>
                            <div className="relative">
                                <Input id="amount" inputMode="numeric" type="text" placeholder="0.0"
                                    value={stakeValue}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setStakeValue(isNaN(Number(e.target.value)) ? 0 : Number(e.target.value))
                                    }
                                    className="pr-12 bg-card border-border text-lg font-mono"
                                    min="0"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                                    RSK
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-accent border border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Staking Benefits</span>
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Earn up to 10% APR on your stake</li>
                                <li>• Rewards are compounded automatically</li>
                                <li>• Withdraw anytime with 7-day cooldown</li>
                            </ul>
                        </div>

                        <Button
                            onClick={() => {
                                setLoading(true)
                                if (tokenBalance > stakeValue) {
                                    approve()
                                    setLoading(false)
                                    setOpen()

                                }
                                else {
                                    toast.error("Insuficient wallet Balance")
                                    setLoading(false)
                                    setOpen()

                                }
                            }}
                            disabled={!isConnected || stakeValue == 0 || loading}
                            className="w-full hover:text-white hover:shadow-gray-300 text-gray-200 font-semibold py-3 transition-smooth"
                        >
                            Stake
                        </Button>

                        {!isConnected && (
                            <p className="text-center text-sm text-muted-foreground">
                                Connect your wallet to start staking
                            </p>
                        )}
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    )
}

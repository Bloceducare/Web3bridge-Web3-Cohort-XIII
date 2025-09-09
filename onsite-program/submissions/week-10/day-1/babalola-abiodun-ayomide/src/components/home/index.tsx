import { useAccount } from "wagmi"
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useState } from "react";
import StakeModal from "./stakeModal";
import StakingPosition from "./stakingPosition";
import AllStakes from "./allStakes";

export default function Home() {
    const { isConnected } = useAccount();
    const [isOpen, setOpen] = useState<boolean>(false)
    function toggle() {
        setOpen(!isOpen);
    }
    return (
        <div className="w-full">
            <div className="w-full text-center py-2">

                <article className="py-15 flex flex-col justify-between items-center text-cnter w-full gap-2">
                    <h5 className="text-lg">
                        Stake and Earn your rewards
                    </h5>
                    <span className="text-primary text-[0.8rem] max-w-[400px]">
                        Join thousands of stakers earning competitive rewards on Ethereum. Simple, secure, and transparent DeFi staking.
                    </span>
                    <Button className={'my-4'} onClick={() => {
                        if (!isConnected) {
                            toast.error("Kindly Connect your Wallet to Stake");
                            return;
                        }
                    }}>Stake Now</Button>
                </article>
                {isOpen &&
                    <StakeModal setOpen={() => toggle()} />}
            </div>
            <section className="flex flex-col sm:flex-row gap-2 px-3">
                <div className="bg-card/50 p-2 w-full sm:w-[50%]">
                    <StakingPosition />
                </div>
                <section className="mb-5">
                    <div className="bg-card/50 ">
                        <AllStakes />
                    </div>
                </section>
            </section>

        </div >
    )
}
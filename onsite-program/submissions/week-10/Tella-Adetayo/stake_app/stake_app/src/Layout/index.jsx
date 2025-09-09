import { ConnectButton } from "@rainbow-me/rainbowkit";

import React, { useState } from "react";
import useStakeAmount from "../hooks/useStake";
import useStackWithdraw from "../hooks/useStakeWithdraw";
import useEmergencyWithdraw from "../hooks/useEmergencyWithdraw";
import useClaimRewards from "../hooks/useClaimReward";
import useStakingParams from "../hooks/useStakingParams";
import useCurrentUserStakeParams from "../hooks/useCurrentUserStakeParams";
import { toast } from "sonner";

function AppLayout() {
    const { stake, approve, balance } = useStakeAmount(); 
    const { withdrawStake } = useStackWithdraw();
    const { emergencyWithdraw } = useEmergencyWithdraw(); 
    const [amount, setAmount] = useState(""); 
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const { claimRewards } = useClaimRewards();
    const { totalStaked, currentRewardRate } = useStakingParams(); 
    const { stakedAmount, pendingRewards, timeUntilUnlock } = useCurrentUserStakeParams();

    const handleStake = async () => {
    if (!amount || Number(amount) <= 0) {
        alert("Enter a valid amount");
        return;
    }

    try {
        await approve(amount); 
        // console.log("Approval successful");
        toast("Approve successful")

        const txHash = await stake(amount);
        // toast("Staked successfully:", tx)
        // console.log("Staked successfully:", tx);
        toast("Staked successfully!", {
            description: `Transaction Hash: ${txHash}`,
            action: {
            label: "View",
            onClick: () => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank")}
    })
    } catch (err) {
        console.error("Stake flow failed:", err);
        toast.error(`Stake flow failed: ${err}`); 
    }
    };


    const handleWithdrawStack = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            // alert("Enter a amount")
            toast("Enter a amount");
            return; 
        }

        try {
            const txHash = await withdrawStake(withdrawAmount); 
            toast("Withdrawal successfully!", {
            description: `Transaction Hash: ${txHash}`,
            action: {
            label: "View",
            onClick: () => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank")}
            })
        } catch(err) {
            // console.error("Stake withdraw failed:", err); 
            toast.error(`stake withdraw failed: ${err}`);
        }
    }

    const handleEmergencyWithdraw = async () => {
        try {
            const txHash = await emergencyWithdraw(); 
            //  console.log("Emergency Withdraw Tx:", txHash);
            // alert("Emergency Withdraw Submitted: " + txHash);
            toast("Withdrawal successfully!", {
            description: `Transaction Hash: ${txHash}`,
            action: {
            label: "View",
            onClick: () => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank")}
            })
        } catch(err) {
            // console.error("Emergency with failed:", err)
            toast.error(`Emergency withdraw failed ${err}`); 
        }
    }

    const handleClaimRewards = async () => {
        try {
            const txHash = await claimRewards(); 
            //  console.log("Claim Rewards Tx:", txHash);
            // alert("Claim rewards Submitted: " + txHash);
            toast("Claim Rewards successfully!", {
                description: `Transaction Hash: ${txHash}`,
                action: {
                label: "View",
                onClick: () => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank")}
            })
        } catch(err) {
            // console.error("claim rewards transaction failed:", err)
            toast.error(`Claim rewards transaction failed: ${err}`); 
        }
    }


    return (
        <div className="relative flex flex-col min-h-screen overflow-x-hidden bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/10 bg-gray-900 text-gray-200">
        <div className="flex flex-col flex-1">
            {/* Header */}
            <header className="flex items-center justify-between px-4 sm:px-10 py-3 bg-gray-900/50 border-b border-gray-700 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-4 text-xl font-bold text-white">
                {/* Mobile Menu Button */}
                <label htmlFor="menu-toggle" className="md:hidden cursor-pointer">
                <span className="material-symbols-outlined text-3xl">menu</span>
                </label>
                {/* Logo */}
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 48 48">
                <path
                    d="M6 6H42L36 24L42 42H6L12 24L6 6Z"
                    fill="currentColor"
                />
                </svg>
                <h2 className="text-2xl font-extrabold tracking-tight">StakeIt</h2>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2 text-base font-medium text-gray-400 bg-gray-800/60 border border-gray-700 rounded-full px-4 py-2">
                <a href="#" className="px-3 py-1 rounded-full hover:text-white transition">Stake</a>
                <a href="#" className="px-3 py-1 rounded-full hover:text-white transition">Positions</a>
                <a href="#" className="px-3 py-1 rounded-full hover:text-white transition">Rewards</a>
                <a href="#" className="px-3 py-1 rounded-full hover:text-white transition">About</a>
            </nav>

            <div className="flex items-center gap-4">
                <ConnectButton/>
            </div>
            </header>

            {/* Mobile Sidebar */}
            <input type="checkbox" id="menu-toggle" className="hidden peer" />
            <div
            id="menu"
            className="fixed top-0 left-0 h-full w-64 bg-gray-900/80 backdrop-blur-lg border-r border-gray-700 p-6 transform -translate-x-full transition-transform duration-300 ease-in-out z-40 md:hidden peer-checked:translate-x-0"
            >
            <nav className="flex flex-col gap-4 text-lg font-medium text-gray-400 mt-16">
                <a href="#" className="px-3 py-2 rounded-lg hover:text-white transition">Stake</a>
                <a href="#" className="px-3 py-2 rounded-lg hover:text-white transition">Positions</a>
                <a href="#" className="px-3 py-2 rounded-lg hover:text-white transition">Rewards</a>
                <a href="#" className="px-3 py-2 rounded-lg hover:text-white transition">About</a>
            </nav>
            <ConnectButton/>
            </div>

            {/* Main */}
            <main className="flex-1 px-4 md:px-10 lg:px-20 xl:px-40 py-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                {/* Stake Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Stake Your Tokens</h2>
                    <label className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400">Amount</span>
                    <input
                        type="text"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full h-14 p-4 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    </label>
                    <button onClick={handleStake} className="w-full mt-4 h-12 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition">
                    Stake
                    </button>
                </div>

                {/* Withdraw Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Withdraw</h2>
                    <label className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-400">Amount</span>
                    <input
                        type="text"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full h-14 p-4 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    </label>
                    <button onClick={handleWithdrawStack} className="w-full mt-4 h-12 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition">
                    Withdraw
                    </button>
                </div>

                {/* Actions Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 space-y-4">
                    <h2 className="text-xl font-bold">Actions</h2>
                    <button onClick={handleClaimRewards} className="w-full h-12 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">
                    Claim Rewards
                    </button>
                    <button onClick={handleEmergencyWithdraw} className="w-full h-12 px-6 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-lg transition">
                    Emergency Withdraw
                    </button>
                </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8 lg:col-span-2">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                    { label: "Current APR", value: currentRewardRate },
                    { label: "Total Staked", value: totalStaked },
                    { label: "Pending Rewards", value: pendingRewards },
                    { label: "Your Stake", value: stakedAmount },
                    ].map((stat, i) => (
                    <div
                        key={i}
                        className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 flex flex-col gap-2"
                    >
                        <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    ))}
                </div>

                {/* Unlock Timer */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Time Until Unlock</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    {[
                        { value: timeUntilUnlock.days, label: "Days" },
                        { value: timeUntilUnlock.hours, label: "Hours" },
                        { value: timeUntilUnlock.minutes, label: "Minutes" },
                        { value: timeUntilUnlock.seconds, label: "Seconds" },
                    ].map((time, i) => (
                        <div key={i} className="bg-gray-900 p-4 rounded-lg">
                        <p className="text-3xl font-bold">{time.value}</p>
                        <p className="text-sm text-gray-400">{time.label}</p>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Stake Positions */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold p-6">Your Stake Positions</h2>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                        <tr className="bg-gray-900 border-b border-gray-700">
                            <th className="px-6 py-3 text-sm font-semibold text-gray-400">Position ID</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-400">Amount</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-400">Status</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-400 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                        <tr>
                            <td className="px-6 py-4">4</td>
                            <td className="px-6 py-4">750</td>
                            <td className="px-6 py-4">
                            <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-900 text-green-300">
                                Active
                            </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                            <a href="#" className="text-indigo-500 hover:text-indigo-400">
                                View
                            </a>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4">5</td>
                            <td className="px-6 py-4">1250</td>
                            <td className="px-6 py-4">
                            <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-yellow-900 text-yellow-300">
                                Pending
                            </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                            <a href="#" className="text-indigo-500 hover:text-indigo-400">
                                View
                            </a>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* All Positions */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold p-6">All Stake Positions</h2>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                        <tr className="bg-gray-900 border-b border-gray-700">
                            <th className="px-6 py-3 text-sm font-semibold text-gray-400">Position ID</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-400">Amount</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-400">Status</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-400 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                        <tr>
                            <td className="px-6 py-4">1</td>
                            <td className="px-6 py-4">1000</td>
                            <td className="px-6 py-4">
                            <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-900 text-green-300">
                                Active
                            </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                            <a href="#" className="text-indigo-500 hover:text-indigo-400">
                                View
                            </a>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4">2</td>
                            <td className="px-6 py-4">500</td>
                            <td className="px-6 py-4">
                            <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-yellow-900 text-yellow-300">
                                Pending
                            </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                            <a href="#" className="text-indigo-500 hover:text-indigo-400">
                                View
                            </a>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4">3</td>
                            <td className="px-6 py-4">2000</td>
                            <td className="px-6 py-4">
                            <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-gray-700 text-gray-300">
                                Completed
                            </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                            <a href="#" className="text-indigo-500 hover:text-indigo-400">
                                View
                            </a>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    </div>
                </div>
                </div>
            </div>
            </main>
        </div>
        </div>
    );
}

export default AppLayout; 

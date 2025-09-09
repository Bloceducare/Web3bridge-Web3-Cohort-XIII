"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { WalletConnect } from "../components/walletConnect";
import { StakeForm } from "../components/stakeForm";
import { WithdrawForm } from "../components/withdrawnForm";
import { ClaimRewards } from "../components/claimRewards";
import { EmergencyWithdraw } from "../components/emergencyWithdraw";
import { UserStats } from "../components/userStats";
import { ProtocolStats } from "../components/protocolStats";
import { Menu, X } from "lucide-react"; // icons
import { useStakingEvents } from "../hooks/useContractEvent";

export default function Home() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("protocol");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useStakingEvents();

  const menuItems = [
    { key: "protocol", label: "Protocol Stats", component: <ProtocolStats /> },
    { key: "user", label: "User Stats", component: <UserStats /> },
    { key: "stake", label: "Stake Tokens", component: <StakeForm /> },
    { key: "withdraw", label: "Withdraw", component: <WithdrawForm /> },
    { key: "claim", label: "Claim Rewards", component: <ClaimRewards /> },
    {
      key: "emergency",
      label: "Emergency Withdraw",
      component: <EmergencyWithdraw />,
    },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Staking Pool
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Stake your tokens and earn rewards on{" "}
          <span className="font-semibold">STK</span>
        </p>
        <WalletConnect />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out bg-white shadow-lg w-64 z-40`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-900">Staking Pool</h1>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setSidebarOpen(false); // close on mobile
              }}
              className={`w-full text-left px-4 py-2 rounded-lg cursor-pointer ${
                activeTab === item.key
                  ? "bg-blue-100 text-blue-800 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="hidden lg:block mr-6 mt-3">
          <WalletConnect />
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between p-4 bg-white shadow-md md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <WalletConnect />
        </div>

        <div className="p-6">
          {/* Render active component */}
          {menuItems.find((item) => item.key === activeTab)?.component}
        </div>
      </div>
    </div>
  );
}


import { StakeToken } from "@/components/StakeToken";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";

type AppLayoutProps = {
  children: ReactNode;  
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isConnected, address } = useAccount();

  
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <div className="bg-slate-500">
        <header className="h-20 py-3 flex justify-between items-center mx-auto container">
          <p className="text-white capitalize font-medium text-2xl">
            StakingDapp
          </p>
          <div className="flex items-center gap-4">
            <ConnectButton/>  
            {isConnected && address && <StakeToken />}       
          </div>
        </header>
      </div>
      <main className="flex-1">{children}</main>
      <footer className=" bg-slate-500 text-white mt-5">
        <p className="text-center my-6">StakingDapp &copy; 2025</p>
      </footer>
    </div>
  );
};

export default AppLayout;

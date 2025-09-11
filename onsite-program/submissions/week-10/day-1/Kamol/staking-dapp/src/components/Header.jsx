import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";

export default function Header() {
  return (
    <header className="p-4 bg-amber-100 flex justify-between items-center">
      <h1 className="text-xl font-bold">Staking DApp</h1>
      <ConnectButton />
    </header>
  );
}

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import useStaking from "../../hooks/useStaking";

const AppLayout = ({ children }) => {
  const { totalStaked, currentApr } = useStaking();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-violet-600 text-white">
        <div className="container mx-auto h-14 px-4 flex items-center">
          {/* Logo / App Name */}
          <span className="font-semibold text-lg tracking-tight">Staking DApp</span>

          {/* Protocol Stats */}
          <div className="hidden md:flex items-center gap-6 text-sm ml-6">
            <span className="opacity-90">
              Total Staked: <span className="font-medium">{totalStaked ? totalStaked.toString() : "0"} TOKEN</span>
            </span>
            <span className="opacity-90">
              APR: <span className="font-medium">{currentApr ?? "—"}%</span>
            </span>
          </div>

          {/* Wallet Connect */}
          <div className="ml-auto flex gap-3 items-center">
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/60">
        <div className="container mx-auto px-4 h-14 flex items-center text-sm text-zinc-600">
          &copy; Cohort XIII {new Date().getFullYear()}
        </div>
      </footer>

      <Toaster />
    </div>
  );
};

export default AppLayout;

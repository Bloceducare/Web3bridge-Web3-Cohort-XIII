import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import MinimalStaking3 from "./pages/staking";
import { WagmiProvider } from "wagmi";
import { config } from "./config/rainbowKit";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}> 
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MinimalStaking3 />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </RainbowKitProvider>
  </QueryClientProvider>
  </WagmiProvider>
);

export default App;

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "viem";

export const config = getDefaultConfig({
    appName: "Staking dApp",
    projectId: "3a882e00d37608ab3c3429584b7ed1d6",
    chains: [sepolia],
    transports:{
        [sepolia.id]: http("https://ethereum-sepolia-public.nodies.app") 
    }
});

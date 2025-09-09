import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
    appName: "Staking DApp",
    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    chains: [sepolia],

});

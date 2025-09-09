import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "viem";


export const config = getDefaultConfig({
    appName: "Cohort Xiii Dao dApp",
    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    chains: [sepolia],
    transports:{
        [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/lLpkkKh-qYy07aId2w0OybrzwtrmeUwx"),
    }
});

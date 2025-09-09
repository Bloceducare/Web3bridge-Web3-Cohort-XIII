import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {  sepolia } from "viem/chains";
import { APP_NAME, PROJECT_ID } from "./constants";

export const  config = getDefaultConfig({
  appName: APP_NAME,
  projectId: PROJECT_ID,
  chains: [sepolia]
});

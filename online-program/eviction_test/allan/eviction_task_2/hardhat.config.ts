import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const shouldFork = !!process.env.MAINNET_RPC_URL;

const config: HardhatUserConfig = {
	solidity: {
		compilers: [
			{ version: "0.8.28" },
			{ version: "0.6.12" },
			{ version: "0.5.16" },
			{ version: "0.4.26" },
		],
	},
	networks: {
		hardhat: {
			...(shouldFork
				? {
					forking: {
						url: process.env.MAINNET_RPC_URL as string,
					},
					chainId: 1,
				}
				: {}),
		},
	},
};

export default config; 
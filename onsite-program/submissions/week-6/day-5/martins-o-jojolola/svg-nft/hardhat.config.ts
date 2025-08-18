import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";
import "@typechain/hardhat";
require("dotenv").config()

const { LISK_SEPOLIA_URL, SEPOLIA_RPC_URL } = process.env;

const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
    solidity: "0.8.28",

    networks: {
        'lisk-sepolia': {
            url: LISK_SEPOLIA_URL,
            accounts: [PRIVATE_KEY as string],
            gasPrice: 1000000000,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY as string],
        },
    },

    etherscan: {
        apiKey: {
            sepolia: process.env.ETHERSCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "lisk-sepolia",
                chainId: 4202,
                urls: {
                    apiURL: "https://sepolia-blockscout.lisk.com/api",
                    browserURL: "https://sepolia-blockscout.lisk.com"
                }
            },
            {
                network: "sepolia",
                chainId: 11155111,
                urls: {
                    apiURL: "https://api-sepolia.etherscan.io/api",
                    browserURL: "https://sepolia.etherscan.io"
                }
            }
        ]
    },
    sourcify: {
        enabled: false
    },
};

export default config;
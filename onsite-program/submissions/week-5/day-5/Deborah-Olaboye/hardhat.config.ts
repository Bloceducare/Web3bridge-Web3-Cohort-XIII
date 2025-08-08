require("@nomicfoundation/hardhat-foundry");
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import { vars } from "hardhat/config";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
 solidity: "0.8.28",
 networks: {
 liskSepolia: {
 url: "https://rpc.sepolia-api.lisk.com",
 accounts: [PRIVATE_KEY],
 },
 },
 etherscan: {
 apiKey: {
 "liskSepolia": "123",
 },
 customChains: [
 {
 network: "liskSepolia",
 chainId: 4202,
 urls: {
 apiURL: "https://sepolia-blockscout.lisk.com/api",
 browserURL: "https://sepolia-blockscout.lisk.com",
 },
 },
 ],
 },
 sourcify: {
 enabled: false,
 },
};

export default config;
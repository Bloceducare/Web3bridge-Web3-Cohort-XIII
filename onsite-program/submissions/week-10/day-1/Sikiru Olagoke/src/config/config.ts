import { STAKING_CONTRACT_ABI } from "@/constant/abi";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { erc20Abi } from "viem";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(import.meta.env.VITE_ALCHEMY_RPC_URL),
});

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(import.meta.env.VITE_ALCHEMY_RPC_URL),
});

export const contractData = {
  contractAddress: import.meta.env.VITE_STAKE_WITH_ME_CONTRACT,
  contractABI: STAKING_CONTRACT_ABI,
};

export const tokenData = {
  tokenAddress: import.meta.env.VITE_STAKE_WITH_ME_TOKEN_CONTRACT,
  tokenABI: erc20Abi,
};

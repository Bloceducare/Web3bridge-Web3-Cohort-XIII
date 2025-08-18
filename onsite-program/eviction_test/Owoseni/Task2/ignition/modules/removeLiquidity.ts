// scripts/removeLiquidity.ts
import { ethers } from "hardhat";
import { UniswapV2Router02 } from "../typechain-types"; 

async function main() {
  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router on Ethereum mainnet, use Sepolia equivalent
  const router = (await ethers.getContractAt(
    "UniswapV2Router02",
    routerAddress
  )) as UniswapV2Router02;

  const tokenA = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6b14"; 
  const tokenB = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  const liquidity = ethers.utils.parseUnits("1", 18); 
  const amountAMin = ethers.utils.parseUnits("0", 18);
  const amountBMin = ethers.utils.parseUnits("0", 18); 
  const to = await ethers.getSigner().getAddress();
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  const tx = await router.removeLiquidity(
    tokenA,
    tokenB,
    liquidity,
    amountAMin,
    amountBMin,
    to,
    deadline
  );
  await tx.wait();
  console.log("Transaction hash:", tx.hash);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
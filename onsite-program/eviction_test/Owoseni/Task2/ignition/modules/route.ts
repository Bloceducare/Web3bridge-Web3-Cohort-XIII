// scripts/interactWithRouter.ts
import { ethers } from "hardhat";
import { UniswapV2Router02 } from "../typechain-types";

async function main() {
  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; 
  const router = (await ethers.getContractAt(
    "UniswapV2Router02",
    routerAddress
  )) as UniswapV2Router02;

  const factoryAddress = await router.factory();
  console.log("Factory address:", factoryAddress);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
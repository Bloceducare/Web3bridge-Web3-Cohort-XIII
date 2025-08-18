import { ethers } from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-toolbox/network-helpers"

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
  
  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const amountOut = ethers.parseUnits("500", 18);
  const amountInMax = ethers.parseUnits("1000", 6);
  const path = [USDCAddress, DAIAddress];

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  console.log("Approving USDC for Uniswap Router...");

  const approveTx = await USDC.connect(impersonatedSigner).approve(UNIRouter, amountInMax);
  await approveTx.wait();

  console.log("Token approval successful at:", approveTx.hash);

  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalBefore = await DAI.balanceOf(impersonatedSigner.address);

  console.log("USDC Balance Before:", ethers.formatUnits(usdcBalBefore, 6));
  console.log("DAI Balance Before:", ethers.formatUnits(daiBalBefore, 18));

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Swapping USDC for exact DAI...");

  const swapTx = await ROUTER.connect(impersonatedSigner).swapTokensForExactTokens(
    amountOut,
    amountInMax,
    path,
    impersonatedSigner.address,
    deadline
  );

  await swapTx.wait();

  console.log("Swap successful at:", swapTx.hash);

  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);

  console.log("USDC Balance After:", ethers.formatUnits(usdcBalAfter, 6));
  console.log("DAI Balance After:", ethers.formatUnits(daiBalAfter, 18));

  const usdcUsed = usdcBalBefore - usdcBalAfter;
  const daiReceived = daiBalAfter - daiBalBefore;

  console.log("USDC Used:", ethers.formatUnits(usdcUsed, 6));
  console.log("DAI Received:", ethers.formatUnits(daiReceived, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

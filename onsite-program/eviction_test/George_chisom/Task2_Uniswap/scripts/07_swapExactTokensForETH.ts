import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("=== Uniswap V2: Swap Exact Tokens for ETH ===\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // Token addresses
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  // Get contract instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  // Check initial balances
  const ethBal = await ethers.provider.getBalance(AssetHolder);
  const usdcBal = await USDC.balanceOf(AssetHolder);

  console.log("Initial Balances:");
  console.log("ETH Balance:", ethers.formatEther(ethBal.toString()));
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log();

  // Swap 500 USDC for ETH
  const amountIn = ethers.parseUnits("500", 6);
  const path = [USDCAddress, WETHAddress];

  // Get expected output
  const amountsOut = await Router.getAmountsOut(amountIn, path);
  const expectedETH = amountsOut[1];
  console.log("Expected ETH output:", ethers.formatEther(expectedETH.toString()));

  // Set minimum output with 2% slippage
  const minAmountOut = (expectedETH * 98n) / 100n;
  console.log("Minimum ETH output (2% slippage):", ethers.formatEther(minAmountOut.toString()));
  console.log();

  // Approve USDC
  console.log("Approving USDC...");
  const approval = await USDC.connect(impersonatedSigner).approve(UNIRouter, amountIn);
  await approval.wait();
  console.log("USDC approved");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Execute swap
  console.log("Executing swap...");
  const swap = await Router.connect(impersonatedSigner).swapExactTokensForETH(
    amountIn,
    minAmountOut,
    path,
    impersonatedSigner.address,
    deadline
  );

  const receipt = await swap.wait();
  console.log("Swap executed successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());
  console.log();

  // Check final balances
  const ethBalAfter = await ethers.provider.getBalance(AssetHolder);
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);

  console.log("Final Balances:");
  console.log("ETH Balance:", ethers.formatEther(ethBalAfter.toString()));
  console.log("USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log();

  console.log("Trade Summary:");
  const usdcSpent = usdcBal - usdcBalAfter;
  const ethReceived = ethBalAfter - ethBal;
  console.log("USDC Spent:", ethers.formatUnits(usdcSpent.toString(), 6));
  console.log("ETH Received:", ethers.formatEther(ethReceived.toString()));
  
  // Calculate rate
  if (usdcSpent > 0n) {
    const rate = ethReceived * ethers.parseUnits("1", 6) / usdcSpent;
    console.log("Exchange Rate:", ethers.formatEther(rate.toString()), "ETH per USDC");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

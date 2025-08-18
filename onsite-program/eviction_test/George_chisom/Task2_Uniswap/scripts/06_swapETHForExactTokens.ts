import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("=== Uniswap V2: Swap ETH for Exact Tokens ===\n");

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

  // Want exactly 1000 USDC
  const amountOut = ethers.parseUnits("1000", 6);
  const path = [WETHAddress, USDCAddress];

  // Get required input
  const amountsIn = await Router.getAmountsIn(amountOut, path);
  const requiredETH = amountsIn[0];
  console.log("Required ETH input:", ethers.formatEther(requiredETH.toString()));

  // Set maximum input with 2% slippage
  const maxAmountIn = (requiredETH * 102n) / 100n;
  console.log("Maximum ETH input (2% slippage):", ethers.formatEther(maxAmountIn.toString()));
  console.log("Exact USDC output:", ethers.formatUnits(amountOut.toString(), 6));
  console.log();

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Execute swap
  console.log("Executing swap...");
  const swap = await Router.connect(impersonatedSigner).swapETHForExactTokens(
    amountOut,
    path,
    impersonatedSigner.address,
    deadline,
    { value: maxAmountIn }
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
  const ethSpent = ethBal - ethBalAfter;
  const usdcReceived = usdcBalAfter - usdcBal;
  console.log("ETH Spent:", ethers.formatEther(ethSpent.toString()));
  console.log("USDC Received:", ethers.formatUnits(usdcReceived.toString(), 6));
  
  // Verify exact output
  console.log("Expected USDC:", ethers.formatUnits(amountOut.toString(), 6));
  console.log("Actual USDC received:", ethers.formatUnits(usdcReceived.toString(), 6));
  console.log("Exact match:", usdcReceived === amountOut ? "Yes" : "No");
  
  // Calculate effective rate
  if (ethSpent > 0n) {
    const effectiveRate = usdcReceived * ethers.parseEther("1") / ethSpent;
    console.log("Effective Rate:", ethers.formatUnits(effectiveRate.toString(), 6), "USDC per ETH");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

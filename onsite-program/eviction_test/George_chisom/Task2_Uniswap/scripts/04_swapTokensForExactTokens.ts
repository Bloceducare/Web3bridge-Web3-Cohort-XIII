import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("=== Uniswap V2: Swap Tokens for Exact Tokens ===\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // Token addresses
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  // Get contract instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  // Check initial balances
  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);

  console.log("Initial Balances:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));
  console.log();

  // Want exactly 50 DAI
  const amountOut = ethers.parseUnits("50", 18);
  const path = [USDCAddress, DAIAddress];

  // Get required input
  const amountsIn = await Router.getAmountsIn(amountOut, path);
  const requiredUSDC = amountsIn[0];
  console.log("Required USDC input:", ethers.formatUnits(requiredUSDC.toString(), 6));

  // Set maximum input with 2% slippage
  const maxAmountIn = (requiredUSDC * 102n) / 100n;
  console.log("Maximum USDC input (2% slippage):", ethers.formatUnits(maxAmountIn.toString(), 6));
  console.log("Exact DAI output:", ethers.formatUnits(amountOut.toString(), 18));
  console.log();

  // Approve USDC
  console.log("Approving USDC...");
  const approval = await USDC.connect(impersonatedSigner).approve(UNIRouter, maxAmountIn);
  await approval.wait();
  console.log("USDC approved");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Execute swap
  console.log("Executing swap...");
  const swap = await Router.connect(impersonatedSigner).swapTokensForExactTokens(
    amountOut,
    maxAmountIn,
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
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const daiBalAfter = await DAI.balanceOf(AssetHolder);

  console.log("Final Balances:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBalAfter.toString(), 18));
  console.log();

  console.log("Trade Summary:");
  console.log("USDC Spent:", ethers.formatUnits((usdcBal - usdcBalAfter).toString(), 6));
  console.log("DAI Received:", ethers.formatUnits((daiBalAfter - daiBal).toString(), 18));
  
  // Verify exact output
  const actualDAIReceived = daiBalAfter - daiBal;
  console.log("Expected DAI:", ethers.formatUnits(amountOut.toString(), 18));
  console.log("Actual DAI received:", ethers.formatUnits(actualDAIReceived.toString(), 18));
  console.log("Exact match:", actualDAIReceived === amountOut ? "Yes" : "No");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

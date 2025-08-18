import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("=== Uniswap V2: Remove Liquidity ETH Supporting Fee on Transfer Tokens ===\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // Token addresses
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  // Get contract instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);
  const Factory = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);

  // Get pair address for USDC/WETH
  const pairAddress = await Factory.getPair(USDCAddress, WETHAddress);
  const Pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);

  console.log("USDC/WETH Pair address:", pairAddress);

  // Check LP token balance
  const lpBalance = await Pair.balanceOf(AssetHolder);
  console.log("LP Token Balance:", ethers.formatEther(lpBalance.toString()));

  if (lpBalance === 0n) {
    console.log("No LP tokens to remove. Please add liquidity first.");
    return;
  }

  // Check initial balances
  const ethBal = await ethers.provider.getBalance(AssetHolder);
  const usdcBal = await USDC.balanceOf(AssetHolder);

  console.log("\nInitial Balances:");
  console.log("ETH Balance:", ethers.formatEther(ethBal.toString()));
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));

  // Remove 25% of liquidity
  const liquidityToRemove = lpBalance / 4n;
  console.log("\nRemoving liquidity:", ethers.formatEther(liquidityToRemove.toString()));

  // Approve LP tokens
  const approvalLP = await Pair.connect(impersonatedSigner).approve(UNIRouter, liquidityToRemove);
  await approvalLP.wait();
  console.log("LP tokens approved");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Remove liquidity with fee-on-transfer support
  console.log("Removing liquidity with fee-on-transfer support...");
  const removeLiquidity = await Router.connect(impersonatedSigner).removeLiquidityETHSupportingFeeOnTransferTokens(
    USDCAddress,
    liquidityToRemove,
    1, // Minimum USDC
    1, // Minimum ETH
    impersonatedSigner.address,
    deadline
  );

  const receipt = await removeLiquidity.wait();
  console.log("Liquidity removed successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());

  // Check final balances
  const ethBalAfter = await ethers.provider.getBalance(AssetHolder);
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const lpBalanceAfter = await Pair.balanceOf(AssetHolder);

  console.log("\nFinal Balances:");
  console.log("ETH Balance:", ethers.formatEther(ethBalAfter.toString()));
  console.log("USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log("LP Token Balance:", ethers.formatEther(lpBalanceAfter.toString()));

  console.log("\nTokens Received:");
  const ethReceived = ethBalAfter - ethBal;
  const usdcReceived = usdcBalAfter - usdcBal;
  console.log("ETH Received:", ethers.formatEther(ethReceived.toString()));
  console.log("USDC Received:", ethers.formatUnits(usdcReceived.toString(), 6));
  
  console.log("\nNote: This function is designed for tokens with transfer fees.");
  console.log("It handles cases where the actual received amount may be less than expected due to fees.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

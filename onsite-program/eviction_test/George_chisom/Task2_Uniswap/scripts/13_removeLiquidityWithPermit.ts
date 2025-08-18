import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("=== Uniswap V2: Remove Liquidity with Permit ===\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // Token addresses
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  // Get contract instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);
  const Factory = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);

  // Get pair address
  const pairAddress = await Factory.getPair(USDCAddress, DAIAddress);
  const Pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);

  console.log("USDC/DAI Pair address:", pairAddress);

  // Check LP token balance
  const lpBalance = await Pair.balanceOf(AssetHolder);
  console.log("LP Token Balance:", ethers.formatEther(lpBalance.toString()));

  if (lpBalance === 0n) {
    console.log("No LP tokens to remove. Please add liquidity first.");
    return;
  }

  // Check initial token balances
  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);

  console.log("\nInitial Token Balances:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));

  // Remove 30% of liquidity
  const liquidityToRemove = lpBalance * 30n / 100n;
  console.log("\nRemoving liquidity:", ethers.formatEther(liquidityToRemove.toString()));

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // For this example, we'll use approveMax = true and dummy signature values
  // In a real implementation, you would generate proper EIP-712 signatures
  const approveMax = true;
  const v = 27;
  const r = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const s = "0x0000000000000000000000000000000000000000000000000000000000000000";

  console.log("Note: This example uses dummy permit signature values.");
  console.log("In production, you would generate proper EIP-712 signatures.");
  console.log();

  try {
    // Remove liquidity with permit
    console.log("Removing liquidity with permit...");
    const removeLiquidity = await Router.connect(impersonatedSigner).removeLiquidityWithPermit(
      USDCAddress,
      DAIAddress,
      liquidityToRemove,
      1, // Minimum USDC
      1, // Minimum DAI
      impersonatedSigner.address,
      deadline,
      approveMax,
      v,
      r,
      s
    );

    const receipt = await removeLiquidity.wait();
    console.log("Liquidity removed successfully!");
    console.log("Transaction hash:", receipt?.hash);
    console.log("Gas used:", receipt?.gasUsed.toString());

    // Check final balances
    const usdcBalAfter = await USDC.balanceOf(AssetHolder);
    const daiBalAfter = await DAI.balanceOf(AssetHolder);
    const lpBalanceAfter = await Pair.balanceOf(AssetHolder);

    console.log("\nFinal Balances:");
    console.log("USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
    console.log("DAI Balance:", ethers.formatUnits(daiBalAfter.toString(), 18));
    console.log("LP Token Balance:", ethers.formatEther(lpBalanceAfter.toString()));

    console.log("\nTokens Received:");
    console.log("USDC Received:", ethers.formatUnits((usdcBalAfter - usdcBal).toString(), 6));
    console.log("DAI Received:", ethers.formatUnits((daiBalAfter - daiBal).toString(), 18));

  } catch (error: any) {
    console.log("Expected error with dummy permit signature:");
    console.log(error.message);
    console.log("\nTo use this function properly, you need to:");
    console.log("1. Generate a proper EIP-712 signature for the permit");
    console.log("2. Use the correct v, r, s values from the signature");
    console.log("3. Ensure the signature is valid for the LP token contract");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

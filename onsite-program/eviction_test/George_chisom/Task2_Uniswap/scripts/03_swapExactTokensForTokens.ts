import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("=== Uniswap V2: Swap Exact Tokens for Tokens ===\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [AssetHolder],
  });

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

  // Swap 100 USDC for DAI
  const amountIn = ethers.parseUnits("100", 6);
  const path = [USDCAddress, DAIAddress];

  // Get expected output
  const amountsOut = await Router.getAmountsOut(amountIn, path);
  const expectedDAI = amountsOut[1];
  console.log(
    "Expected DAI output:",
    ethers.formatUnits(expectedDAI.toString(), 18)
  );

  // Set minimum output with 2% slippage
  const minAmountOut = (expectedDAI * 98n) / 100n;
  console.log(
    "Minimum DAI output (2% slippage):",
    ethers.formatUnits(minAmountOut.toString(), 18)
  );
  console.log();

  // Gas settings
  const gasPrice = ethers.parseUnits("20", "gwei");

  // Approve USDC
  console.log("Approving USDC...");
  const approval = await USDC.connect(impersonatedSigner).approve(
    UNIRouter,
    amountIn,
    { gasPrice, gasLimit: 100000 }
  );
  await approval.wait();
  console.log("USDC approved");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Execute swap
  console.log("Executing swap...");
  const swap = await Router.connect(
    impersonatedSigner
  ).swapExactTokensForTokens(
    amountIn,
    minAmountOut,
    path,
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 200000 }
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
  console.log(
    "USDC Spent:",
    ethers.formatUnits((usdcBal - usdcBalAfter).toString(), 6)
  );
  console.log(
    "DAI Received:",
    ethers.formatUnits((daiBalAfter - daiBal).toString(), 18)
  );

  // Calculate actual rate
  const actualRate =
    ((daiBalAfter - daiBal) * ethers.parseUnits("1", 6)) /
    (usdcBal - usdcBalAfter);
  console.log(
    "Exchange Rate:",
    ethers.formatUnits(actualRate.toString(), 18),
    "DAI per USDC"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

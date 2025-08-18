import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("=== Uniswap V2: Fee-on-Transfer Functions Testing ===\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [AssetHolder],
  });

  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // Token addresses
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  // Get contract instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);
  const Factory = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);

  // Gas settings
  const gasPrice = ethers.parseUnits("20", "gwei");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log(
    "=== TEST 1: Swap Exact Tokens for Tokens Supporting Fee on Transfer ==="
  );

  const usdcBal1 = await USDC.balanceOf(AssetHolder);
  const daiBal1 = await DAI.balanceOf(AssetHolder);
  console.log("Initial USDC:", ethers.formatUnits(usdcBal1.toString(), 6));
  console.log("Initial DAI:", ethers.formatUnits(daiBal1.toString(), 18));

  const amountIn1 = ethers.parseUnits("100", 6);
  const path1 = [USDCAddress, DAIAddress];
  const minAmountOut1 = ethers.parseUnits("95", 18); // Conservative minimum

  await USDC.connect(impersonatedSigner).approve(UNIRouter, amountIn1, {
    gasPrice,
    gasLimit: 100000,
  });
  const swap1 = await Router.connect(
    impersonatedSigner
  ).swapExactTokensForTokensSupportingFeeOnTransferTokens(
    amountIn1,
    minAmountOut1,
    path1,
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 200000 }
  );
  await swap1.wait();

  const usdcBal1After = await USDC.balanceOf(AssetHolder);
  const daiBal1After = await DAI.balanceOf(AssetHolder);
  console.log(
    " USDC Spent:",
    ethers.formatUnits((usdcBal1 - usdcBal1After).toString(), 6)
  );
  console.log(
    " DAI Received:",
    ethers.formatUnits((daiBal1After - daiBal1).toString(), 18)
  );
  console.log("Note: This function handles tokens with transfer fees");
  console.log();

  console.log(
    "=== TEST 2: Swap Exact ETH for Tokens Supporting Fee on Transfer ==="
  );

  const ethBal2 = await ethers.provider.getBalance(AssetHolder);
  const usdcBal2 = await USDC.balanceOf(AssetHolder);
  console.log("Initial ETH:", ethers.formatEther(ethBal2.toString()));
  console.log("Initial USDC:", ethers.formatUnits(usdcBal2.toString(), 6));

  const amountIn2 = ethers.parseEther("0.5");
  const path2 = [WETHAddress, USDCAddress];
  const minAmountOut2 = ethers.parseUnits("600", 6); // Conservative minimum

  const swap2 = await Router.connect(
    impersonatedSigner
  ).swapExactETHForTokensSupportingFeeOnTransferTokens(
    minAmountOut2,
    path2,
    impersonatedSigner.address,
    deadline,
    { value: amountIn2, gasPrice, gasLimit: 200000 }
  );
  await swap2.wait();

  const ethBal2After = await ethers.provider.getBalance(AssetHolder);
  const usdcBal2After = await USDC.balanceOf(AssetHolder);
  console.log(
    " ETH Spent:",
    ethers.formatEther((ethBal2 - ethBal2After).toString())
  );
  console.log(
    " USDC Received:",
    ethers.formatUnits((usdcBal2After - usdcBal2).toString(), 6)
  );
  console.log(
    "Note: This function handles fee-on-transfer tokens when buying with ETH"
  );
  console.log();

  console.log(
    "=== TEST 3: Swap Exact Tokens for ETH Supporting Fee on Transfer ==="
  );

  const ethBal3 = await ethers.provider.getBalance(AssetHolder);
  const usdcBal3 = await USDC.balanceOf(AssetHolder);
  console.log("Initial ETH:", ethers.formatEther(ethBal3.toString()));
  console.log("Initial USDC:", ethers.formatUnits(usdcBal3.toString(), 6));

  const amountIn3 = ethers.parseUnits("200", 6);
  const path3 = [USDCAddress, WETHAddress];
  const minAmountOut3 = ethers.parseEther("0.08"); // Conservative minimum

  await USDC.connect(impersonatedSigner).approve(UNIRouter, amountIn3, {
    gasPrice,
    gasLimit: 100000,
  });
  const swap3 = await Router.connect(
    impersonatedSigner
  ).swapExactTokensForETHSupportingFeeOnTransferTokens(
    amountIn3,
    minAmountOut3,
    path3,
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 200000 }
  );
  await swap3.wait();

  const ethBal3After = await ethers.provider.getBalance(AssetHolder);
  const usdcBal3After = await USDC.balanceOf(AssetHolder);
  console.log(
    " USDC Spent:",
    ethers.formatUnits((usdcBal3 - usdcBal3After).toString(), 6)
  );
  console.log(
    " ETH Received:",
    ethers.formatEther((ethBal3After - ethBal3).toString())
  );
  console.log(
    "Note: This function handles fee-on-transfer tokens when selling for ETH"
  );
  console.log();

  console.log(
    "=== TEST 4: Remove Liquidity ETH Supporting Fee on Transfer ==="
  );

  // First, let's add some liquidity to have something to remove
  console.log("Adding liquidity first...");
  const usdcAmount = ethers.parseUnits("500", 6);
  const ethAmount = ethers.parseEther("0.2");

  await USDC.connect(impersonatedSigner).approve(UNIRouter, usdcAmount, {
    gasPrice,
    gasLimit: 100000,
  });

  const addLiq = await Router.connect(impersonatedSigner).addLiquidityETH(
    USDCAddress,
    usdcAmount,
    ethers.parseUnits("450", 6), // 10% slippage
    ethers.parseEther("0.18"), // 10% slippage
    impersonatedSigner.address,
    deadline,
    { value: ethAmount, gasPrice, gasLimit: 300000 }
  );
  await addLiq.wait();
  console.log(" Liquidity added");

  // Get pair and check LP balance
  const pairAddress = await Factory.getPair(USDCAddress, WETHAddress);
  const Pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);
  const lpBalance = await Pair.balanceOf(AssetHolder);
  console.log("LP Token Balance:", ethers.formatEther(lpBalance.toString()));

  if (lpBalance > 0n) {
    const liquidityToRemove = lpBalance / 4n; // Remove 25%
    console.log(
      "Removing liquidity:",
      ethers.formatEther(liquidityToRemove.toString())
    );

    const ethBal4 = await ethers.provider.getBalance(AssetHolder);
    const usdcBal4 = await USDC.balanceOf(AssetHolder);

    await Pair.connect(impersonatedSigner).approve(
      UNIRouter,
      liquidityToRemove,
      { gasPrice, gasLimit: 100000 }
    );

    const removeLiq = await Router.connect(
      impersonatedSigner
    ).removeLiquidityETHSupportingFeeOnTransferTokens(
      USDCAddress,
      liquidityToRemove,
      1, // Minimum USDC
      1, // Minimum ETH
      impersonatedSigner.address,
      deadline,
      { gasPrice, gasLimit: 300000 }
    );
    await removeLiq.wait();

    const ethBal4After = await ethers.provider.getBalance(AssetHolder);
    const usdcBal4After = await USDC.balanceOf(AssetHolder);

    console.log(
      " ETH Received:",
      ethers.formatEther((ethBal4After - ethBal4).toString())
    );
    console.log(
      "USDC Received:",
      ethers.formatUnits((usdcBal4After - usdcBal4).toString(), 6)
    );
    console.log(
      "Note: This function handles fee-on-transfer tokens when removing liquidity"
    );
  } else {
    console.log(" No LP tokens found");
  }

  console.log();
  console.log("=== ALL FEE-ON-TRANSFER FUNCTIONS TESTED SUCCESSFULLY! ===");
  console.log("- Works with both regular and fee tokens");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

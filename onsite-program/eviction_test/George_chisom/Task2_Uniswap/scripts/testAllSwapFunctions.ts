import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Comprehensive Uniswap V2 Function Testing\n");

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

  // Get contract instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  // Gas settings
  const gasPrice = ethers.parseUnits("20", "gwei");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("TEST 1: Swap Exact Tokens for Tokens (USDC to DAI)");

  const usdcBal1 = await USDC.balanceOf(AssetHolder);
  const daiBal1 = await DAI.balanceOf(AssetHolder);
  console.log("Initial USDC:", ethers.formatUnits(usdcBal1.toString(), 6));
  console.log("Initial DAI:", ethers.formatUnits(daiBal1.toString(), 18));

  const amountIn1 = ethers.parseUnits("100", 6);
  const path1 = [USDCAddress, DAIAddress];
  const amountsOut1 = await Router.getAmountsOut(amountIn1, path1);
  const minAmountOut1 = (amountsOut1[1] * 98n) / 100n;

  await USDC.connect(impersonatedSigner).approve(UNIRouter, amountIn1, {
    gasPrice,
    gasLimit: 100000,
  });
  const swap1 = await Router.connect(
    impersonatedSigner
  ).swapExactTokensForTokens(
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
    "USDC Spent:",
    ethers.formatUnits((usdcBal1 - usdcBal1After).toString(), 6)
  );
  console.log(
    "DAI Received:",
    ethers.formatUnits((daiBal1After - daiBal1).toString(), 18)
  );
  console.log();

  console.log("TEST 2: Swap Tokens for Exact Tokens (USDC to DAI)");

  const amountOut2 = ethers.parseUnits("50", 18);
  const path2 = [USDCAddress, DAIAddress];
  const amountsIn2 = await Router.getAmountsIn(amountOut2, path2);
  const maxAmountIn2 = (amountsIn2[0] * 102n) / 100n;

  await USDC.connect(impersonatedSigner).approve(UNIRouter, maxAmountIn2, {
    gasPrice,
    gasLimit: 100000,
  });
  const swap2 = await Router.connect(
    impersonatedSigner
  ).swapTokensForExactTokens(
    amountOut2,
    maxAmountIn2,
    path2,
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 200000 }
  );
  await swap2.wait();

  const usdcBal2After = await USDC.balanceOf(AssetHolder);
  const daiBal2After = await DAI.balanceOf(AssetHolder);
  console.log(
    " USDC Spent:",
    ethers.formatUnits((usdcBal1After - usdcBal2After).toString(), 6)
  );
  console.log(
    " DAI Received:",
    ethers.formatUnits((daiBal2After - daiBal1After).toString(), 18)
  );
  console.log();

  console.log("=== TEST 3: Swap Exact ETH for Tokens (ETH → USDC) ===");

  const ethBal3 = await ethers.provider.getBalance(AssetHolder);
  const usdcBal3 = await USDC.balanceOf(AssetHolder);
  console.log("Initial ETH:", ethers.formatEther(ethBal3.toString()));
  console.log("Initial USDC:", ethers.formatUnits(usdcBal3.toString(), 6));

  const amountIn3 = ethers.parseEther("1");
  const path3 = [WETHAddress, USDCAddress];
  const amountsOut3 = await Router.getAmountsOut(amountIn3, path3);
  const minAmountOut3 = (amountsOut3[1] * 98n) / 100n;

  const swap3 = await Router.connect(impersonatedSigner).swapExactETHForTokens(
    minAmountOut3,
    path3,
    impersonatedSigner.address,
    deadline,
    { value: amountIn3, gasPrice, gasLimit: 200000 }
  );
  await swap3.wait();

  const ethBal3After = await ethers.provider.getBalance(AssetHolder);
  const usdcBal3After = await USDC.balanceOf(AssetHolder);
  console.log(
    " ETH Spent:",
    ethers.formatEther((ethBal3 - ethBal3After).toString())
  );
  console.log(
    " USDC Received:",
    ethers.formatUnits((usdcBal3After - usdcBal3).toString(), 6)
  );
  console.log();

  console.log("=== TEST 4: Swap ETH for Exact Tokens (ETH → USDC) ===");

  const amountOut4 = ethers.parseUnits("500", 6);
  const path4 = [WETHAddress, USDCAddress];
  const amountsIn4 = await Router.getAmountsIn(amountOut4, path4);
  const maxAmountIn4 = (amountsIn4[0] * 102n) / 100n;

  const swap4 = await Router.connect(impersonatedSigner).swapETHForExactTokens(
    amountOut4,
    path4,
    impersonatedSigner.address,
    deadline,
    { value: maxAmountIn4, gasPrice, gasLimit: 200000 }
  );
  await swap4.wait();

  const ethBal4After = await ethers.provider.getBalance(AssetHolder);
  const usdcBal4After = await USDC.balanceOf(AssetHolder);
  console.log(
    " ETH Spent:",
    ethers.formatEther((ethBal3After - ethBal4After).toString())
  );
  console.log(
    " USDC Received:",
    ethers.formatUnits((usdcBal4After - usdcBal3After).toString(), 6)
  );
  console.log();

  console.log("=== TEST 5: Swap Exact Tokens for ETH (USDC → ETH) ===");

  const amountIn5 = ethers.parseUnits("300", 6);
  const path5 = [USDCAddress, WETHAddress];
  const amountsOut5 = await Router.getAmountsOut(amountIn5, path5);
  const minAmountOut5 = (amountsOut5[1] * 98n) / 100n;

  await USDC.connect(impersonatedSigner).approve(UNIRouter, amountIn5, {
    gasPrice,
    gasLimit: 100000,
  });
  const swap5 = await Router.connect(impersonatedSigner).swapExactTokensForETH(
    amountIn5,
    minAmountOut5,
    path5,
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 200000 }
  );
  await swap5.wait();

  const ethBal5After = await ethers.provider.getBalance(AssetHolder);
  const usdcBal5After = await USDC.balanceOf(AssetHolder);
  console.log(
    " USDC Spent:",
    ethers.formatUnits((usdcBal4After - usdcBal5After).toString(), 6)
  );
  console.log(
    " ETH Received:",
    ethers.formatEther((ethBal5After - ethBal4After).toString())
  );
  console.log();

  console.log("=== TEST 6: Swap Tokens for Exact ETH (USDC → ETH) ===");

  const amountOut6 = ethers.parseEther("0.1");
  const path6 = [USDCAddress, WETHAddress];
  const amountsIn6 = await Router.getAmountsIn(amountOut6, path6);
  const maxAmountIn6 = (amountsIn6[0] * 102n) / 100n;

  await USDC.connect(impersonatedSigner).approve(UNIRouter, maxAmountIn6, {
    gasPrice,
    gasLimit: 100000,
  });
  const swap6 = await Router.connect(impersonatedSigner).swapTokensForExactETH(
    amountOut6,
    maxAmountIn6,
    path6,
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 200000 }
  );
  await swap6.wait();

  const ethBal6After = await ethers.provider.getBalance(AssetHolder);
  const usdcBal6After = await USDC.balanceOf(AssetHolder);
  console.log(
    " USDC Spent:",
    ethers.formatUnits((usdcBal5After - usdcBal6After).toString(), 6)
  );
  console.log(
    " ETH Received:",
    ethers.formatEther((ethBal6After - ethBal5After).toString())
  );
  console.log();

  console.log("=== ALL SWAP FUNCTIONS TESTED SUCCESSFULLY! ===");
  console.log(" Take screenshots of each test result above");
  console.log(" All functions working with proper gas settings");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

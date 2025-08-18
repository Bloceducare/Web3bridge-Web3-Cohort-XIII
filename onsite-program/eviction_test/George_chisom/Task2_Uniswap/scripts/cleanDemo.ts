import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Uniswap V2 Functions Demo\n");

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

  // Check initial balances
  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);
  const ethBal = await ethers.provider.getBalance(AssetHolder);

  console.log("INITIAL BALANCES");
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));
  console.log("ETH Balance:", ethers.formatEther(ethBal.toString()));
  console.log();

  // 1. ADD LIQUIDITY
  console.log("1. ADD LIQUIDITY (USDC/DAI)");
  const USDCAmount = ethers.parseUnits("1000", 6);
  const DAIAmount = ethers.parseUnits("1000", 18);

  await USDC.connect(impersonatedSigner).approve(UNIRouter, USDCAmount, { gasPrice, gasLimit: 100000 });
  await DAI.connect(impersonatedSigner).approve(UNIRouter, DAIAmount, { gasPrice, gasLimit: 100000 });

  const addLiq = await Router.connect(impersonatedSigner).addLiquidity(
    USDCAddress, DAIAddress, USDCAmount, DAIAmount,
    ethers.parseUnits("950", 6), ethers.parseUnits("950", 18),
    impersonatedSigner.address, deadline,
    { gasPrice, gasLimit: 300000 }
  );
  await addLiq.wait();

  const usdcBal1 = await USDC.balanceOf(AssetHolder);
  const daiBal1 = await DAI.balanceOf(AssetHolder);
  console.log("USDC Used:", ethers.formatUnits((usdcBal - usdcBal1).toString(), 6));
  console.log("DAI Used:", ethers.formatUnits((daiBal - daiBal1).toString(), 18));

  // Check LP tokens
  const pairAddress = await Factory.getPair(USDCAddress, DAIAddress);
  const Pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);
  const lpBalance = await Pair.balanceOf(AssetHolder);
  console.log("LP Tokens Received:", ethers.formatEther(lpBalance.toString()));
  console.log();

  // 2. REMOVE LIQUIDITY
  console.log("2. REMOVE LIQUIDITY (50% of LP tokens)");
  const liquidityToRemove = lpBalance / 2n;

  await Pair.connect(impersonatedSigner).approve(UNIRouter, liquidityToRemove, { gasPrice, gasLimit: 100000 });
  
  const removeLiq = await Router.connect(impersonatedSigner).removeLiquidity(
    USDCAddress, DAIAddress, liquidityToRemove,
    1, 1, impersonatedSigner.address, deadline,
    { gasPrice, gasLimit: 300000 }
  );
  await removeLiq.wait();

  const usdcBal2 = await USDC.balanceOf(AssetHolder);
  const daiBal2 = await DAI.balanceOf(AssetHolder);
  console.log("USDC Received:", ethers.formatUnits((usdcBal2 - usdcBal1).toString(), 6));
  console.log("DAI Received:", ethers.formatUnits((daiBal2 - daiBal1).toString(), 18));
  console.log();

  // 3. SWAP EXACT TOKENS FOR TOKENS
  console.log("3. SWAP EXACT TOKENS FOR TOKENS (100 USDC to DAI)");
  const swapAmount1 = ethers.parseUnits("100", 6);
  const path1 = [USDCAddress, DAIAddress];
  const amountsOut1 = await Router.getAmountsOut(swapAmount1, path1);
  const minOut1 = (amountsOut1[1] * 98n) / 100n;

  await USDC.connect(impersonatedSigner).approve(UNIRouter, swapAmount1, { gasPrice, gasLimit: 100000 });
  
  const swap1 = await Router.connect(impersonatedSigner).swapExactTokensForTokens(
    swapAmount1, minOut1, path1, impersonatedSigner.address, deadline,
    { gasPrice, gasLimit: 200000 }
  );
  await swap1.wait();

  const usdcBal3 = await USDC.balanceOf(AssetHolder);
  const daiBal3 = await DAI.balanceOf(AssetHolder);
  console.log("USDC Spent:", ethers.formatUnits((usdcBal2 - usdcBal3).toString(), 6));
  console.log("DAI Received:", ethers.formatUnits((daiBal3 - daiBal2).toString(), 18));
  console.log();

  // 4. SWAP TOKENS FOR EXACT TOKENS
  console.log("4. SWAP TOKENS FOR EXACT TOKENS (Get exactly 50 DAI)");
  const exactOut = ethers.parseUnits("50", 18);
  const path2 = [USDCAddress, DAIAddress];
  const amountsIn = await Router.getAmountsIn(exactOut, path2);
  const maxIn = (amountsIn[0] * 102n) / 100n;

  await USDC.connect(impersonatedSigner).approve(UNIRouter, maxIn, { gasPrice, gasLimit: 100000 });
  
  const swap2 = await Router.connect(impersonatedSigner).swapTokensForExactTokens(
    exactOut, maxIn, path2, impersonatedSigner.address, deadline,
    { gasPrice, gasLimit: 200000 }
  );
  await swap2.wait();

  const usdcBal4 = await USDC.balanceOf(AssetHolder);
  const daiBal4 = await DAI.balanceOf(AssetHolder);
  console.log("USDC Spent:", ethers.formatUnits((usdcBal3 - usdcBal4).toString(), 6));
  console.log("DAI Received:", ethers.formatUnits((daiBal4 - daiBal3).toString(), 18));
  console.log();

  // 5. SWAP EXACT ETH FOR TOKENS
  console.log("5. SWAP EXACT ETH FOR TOKENS (1 ETH to USDC)");
  const ethAmount = ethers.parseEther("1");
  const path3 = [WETHAddress, USDCAddress];
  const amountsOut3 = await Router.getAmountsOut(ethAmount, path3);
  const minOut3 = (amountsOut3[1] * 98n) / 100n;

  const ethBal1 = await ethers.provider.getBalance(AssetHolder);
  
  const swap3 = await Router.connect(impersonatedSigner).swapExactETHForTokens(
    minOut3, path3, impersonatedSigner.address, deadline,
    { value: ethAmount, gasPrice, gasLimit: 200000 }
  );
  await swap3.wait();

  const ethBal2 = await ethers.provider.getBalance(AssetHolder);
  const usdcBal5 = await USDC.balanceOf(AssetHolder);
  console.log("ETH Spent:", ethers.formatEther((ethBal1 - ethBal2).toString()));
  console.log("USDC Received:", ethers.formatUnits((usdcBal5 - usdcBal4).toString(), 6));
  console.log();

  // 6. SWAP EXACT TOKENS FOR ETH
  console.log("6. SWAP EXACT TOKENS FOR ETH (300 USDC to ETH)");
  const swapAmount4 = ethers.parseUnits("300", 6);
  const path4 = [USDCAddress, WETHAddress];
  const amountsOut4 = await Router.getAmountsOut(swapAmount4, path4);
  const minOut4 = (amountsOut4[1] * 98n) / 100n;

  await USDC.connect(impersonatedSigner).approve(UNIRouter, swapAmount4, { gasPrice, gasLimit: 100000 });
  
  const ethBal3 = await ethers.provider.getBalance(AssetHolder);
  
  const swap4 = await Router.connect(impersonatedSigner).swapExactTokensForETH(
    swapAmount4, minOut4, path4, impersonatedSigner.address, deadline,
    { gasPrice, gasLimit: 200000 }
  );
  await swap4.wait();

  const ethBal4 = await ethers.provider.getBalance(AssetHolder);
  const usdcBal6 = await USDC.balanceOf(AssetHolder);
  console.log("USDC Spent:", ethers.formatUnits((usdcBal5 - usdcBal6).toString(), 6));
  console.log("ETH Received:", ethers.formatEther((ethBal4 - ethBal3).toString()));
  console.log();

  console.log("ALL UNISWAP V2 FUNCTIONS TESTED SUCCESSFULLY");
  console.log("Take screenshots of each function result above");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

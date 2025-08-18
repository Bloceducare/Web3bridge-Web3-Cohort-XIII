import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Uniswap V2: Swap Tokens for Exact Tokens\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [AssetHolder],
  });
  
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const gasPrice = ethers.parseUnits("20", "gwei");

  const usdcBalBefore = await USDC.balanceOf(AssetHolder);
  const daiBalBefore = await DAI.balanceOf(AssetHolder);

  console.log("Initial Balances:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBalBefore.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBalBefore.toString(), 18));
  console.log();

  const amountOut = ethers.parseUnits("50", 18);
  const path = [USDCAddress, DAIAddress];

  console.log("Getting amounts in...");
  const amountsIn = await Router.getAmountsIn(amountOut, path);
  const amountInMax = amountsIn[0] * 105n / 100n;

  console.log("Required USDC in:", ethers.formatUnits(amountsIn[0].toString(), 6));
  console.log("Maximum USDC in:", ethers.formatUnits(amountInMax.toString(), 6));

  console.log("Approving USDC...");
  await USDC.connect(impersonatedSigner).approve(UNIRouter, amountInMax, { gasPrice, gasLimit: 100000 });
  console.log("USDC approved");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Swapping USDC for exact DAI...");
  const swapTx = await Router.connect(impersonatedSigner).swapTokensForExactTokens(
    amountOut,
    amountInMax,
    path,
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 300000 }
  );

  const receipt = await swapTx.wait();
  console.log("Swap completed successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());
  console.log();

  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const daiBalAfter = await DAI.balanceOf(AssetHolder);

  console.log("Final Balances:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBalAfter.toString(), 18));
  console.log();

  console.log("Changes:");
  console.log("USDC Used:", ethers.formatUnits((usdcBalBefore - usdcBalAfter).toString(), 6));
  console.log("DAI Received:", ethers.formatUnits((daiBalAfter - daiBalBefore).toString(), 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

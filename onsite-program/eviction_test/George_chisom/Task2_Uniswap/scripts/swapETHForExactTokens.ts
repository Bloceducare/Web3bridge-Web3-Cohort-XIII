import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Uniswap V2: Swap ETH for Exact Tokens\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [AssetHolder],
  });
  
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const gasPrice = ethers.parseUnits("20", "gwei");

  const ethBalBefore = await ethers.provider.getBalance(AssetHolder);
  const usdcBalBefore = await USDC.balanceOf(AssetHolder);

  console.log("Initial Balances:");
  console.log("ETH Balance:", ethers.formatEther(ethBalBefore.toString()));
  console.log("USDC Balance:", ethers.formatUnits(usdcBalBefore.toString(), 6));
  console.log();

  const amountOut = ethers.parseUnits("1000", 6);
  const path = [WETHAddress, USDCAddress];

  console.log("Getting amounts in...");
  const amountsIn = await Router.getAmountsIn(amountOut, path);
  const amountInMax = amountsIn[0] * 105n / 100n;

  console.log("Required ETH in:", ethers.formatEther(amountsIn[0].toString()));
  console.log("Maximum ETH in:", ethers.formatEther(amountInMax.toString()));

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Swapping ETH for exact USDC...");
  const swapTx = await Router.connect(impersonatedSigner).swapETHForExactTokens(
    amountOut,
    path,
    impersonatedSigner.address,
    deadline,
    { 
      value: amountInMax,
      gasPrice, 
      gasLimit: 300000 
    }
  );

  const receipt = await swapTx.wait();
  console.log("Swap completed successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());
  console.log();

  const ethBalAfter = await ethers.provider.getBalance(AssetHolder);
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);

  console.log("Final Balances:");
  console.log("ETH Balance:", ethers.formatEther(ethBalAfter.toString()));
  console.log("USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log();

  console.log("Changes:");
  console.log("ETH Used:", ethers.formatEther((ethBalBefore - ethBalAfter).toString()));
  console.log("USDC Received:", ethers.formatUnits((usdcBalAfter - usdcBalBefore).toString(), 6));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

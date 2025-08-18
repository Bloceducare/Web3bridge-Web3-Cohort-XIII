import { ethers } from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-toolbox/network-helpers"

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
  
  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const amountOut = ethers.parseUnits("1000", 6);
  const ethAmountMax = ethers.parseEther("2");

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  const WETHAddress = await ROUTER.WETH();
  const path = [WETHAddress, USDCAddress];

  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalBefore = await ethers.provider.getBalance(impersonatedSigner.address);

  console.log("USDC Balance Before:", ethers.formatUnits(usdcBalBefore, 6));
  console.log("ETH Balance Before:", ethers.formatEther(ethBalBefore));

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Swapping ETH for exact USDC...");

  const swapTx = await ROUTER.connect(impersonatedSigner).swapETHForExactTokens(
    amountOut,
    path,
    impersonatedSigner.address,
    deadline,
    { value: ethAmountMax }
  );

  await swapTx.wait();

  console.log("Swap successful at:", swapTx.hash);

  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalAfter = await ethers.provider.getBalance(impersonatedSigner.address);

  console.log("USDC Balance After:", ethers.formatUnits(usdcBalAfter, 6));
  console.log("ETH Balance After:", ethers.formatEther(ethBalAfter));

  const ethUsed = ethBalBefore - ethBalAfter;
  const usdcReceived = usdcBalAfter - usdcBalBefore;

  console.log("ETH Used:", ethers.formatEther(ethUsed));
  console.log("USDC Received:", ethers.formatUnits(usdcReceived, 6));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  console.log("Impersonating account:", USDCHolder);
  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);
  console.log("Signer address:", impersonatedSigner.address);

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  const amountIn = ethers.parseUnits("10000", 6);
  const amountOutMin = ethers.parseUnits("3", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const usdcBalanceBefore = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalanceBefore = await ethers.provider.getBalance(impersonatedSigner.address);

  console.log("USDC Balance before swap:", ethers.formatUnits(usdcBalanceBefore, 6));
  console.log("ETH Balance before swap:", ethers.formatUnits(ethBalanceBefore, 18));

  console.log("Approving Uniswap Router to spend USDC...");
  await USDC.connect(impersonatedSigner).approve(UNIRouter, amountIn);
  console.log("Approval successful!");

  console.log("Executing swap: USDC -> ETH...");
  const tx = await ROUTER.connect(impersonatedSigner).swapExactTokensForETHSupportingFeeOnTransferTokens(
    amountIn,
    amountOutMin,
    [USDCAddress, wethAddress],
    impersonatedSigner.address,
    deadline
  );
  await tx.wait();
  console.log("swapExactTokensForETHSupportingFeeOnTransferTokens executed!");

  const usdcBalanceAfter = await USDC.balanceOf(impersonatedSigner.address);
  const ethBalanceAfter = await ethers.provider.getBalance(impersonatedSigner.address);

  console.log("USDC Balance after swap:", ethers.formatUnits(usdcBalanceAfter, 6));
  console.log("ETH Balance after swap:", ethers.formatUnits(ethBalanceAfter, 18));
};

main().catch((error) => {
  console.error("Error encountered:", error);
  process.exitCode = 1;
});

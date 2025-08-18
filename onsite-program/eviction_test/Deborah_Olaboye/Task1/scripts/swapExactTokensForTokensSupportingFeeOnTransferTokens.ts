import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // USDC contract Address
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  // DAI contract Address
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  // Uniswap V2 Router Address
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);

  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);

  console.log("################### Initial Balance Info ###########################");
  console.log("User Initial USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("User Initial DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));

  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  // Amount of USDC to swap
  const USDCAmount = ethers.parseUnits("1000", 6);

  // Approve router to spend USDC
  const approvalUSDC = await USDC.connect(impersonatedSigner).approve(UNIRouter, USDCAmount);
  await approvalUSDC.wait();
  console.log("USDC approval done.");

  console.log("USDCAmount to swap:", ethers.formatUnits(USDCAmount.toString(), 6));

  const path = [USDCAddress, DAIAddress];
  const to = AssetHolder;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Perform the swap
  const swapTx = await Router.connect(impersonatedSigner).swapExactTokensForTokensSupportingFeeOnTransferTokens(
    USDCAmount,
    1,
    path,
    to,
    deadline
  );
  const receipt = await swapTx.wait();
  console.log("Swap transaction done.");

  // Check balances after swap
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const daiBalAfter = await DAI.balanceOf(AssetHolder);

  console.log("################### Final Balance Info ###########################");
  console.log("User Final USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log("User Final DAI Balance:", ethers.formatUnits(daiBalAfter.toString(), 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
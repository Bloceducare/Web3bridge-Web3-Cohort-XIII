import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("UNISWAP V2 - SWAP EXACT TOKENS FOR TOKENS");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const usdcBalBefore = await USDC.balanceOf(AssetHolder);
  const daiBalBefore = await DAI.balanceOf(AssetHolder);

  console.log("INITIAL BALANCES:");
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalBefore, 6)}`);
  console.log(`DAI Balance: ${ethers.formatUnits(daiBalBefore, 18)}`);

  const swapAmount = ethers.parseUnits("1000", 6);

  console.log(`Swapping ${ethers.formatUnits(swapAmount, 6)} USDC for DAI`);

  const approvalUSDC = await USDC.connect(impersonatedSigner).approve(UNIRouter, swapAmount);
  await approvalUSDC.wait();
  console.log("USDC approved for swap");

  const path = [USDCAddress, DAIAddress];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const swapTx = await Router.connect(impersonatedSigner).swapExactTokensForTokens(
    swapAmount,
    0,
    path,
    impersonatedSigner.address,
    deadline
  );

  const receipt = await swapTx.wait();
  console.log("Swap completed");
  console.log(`Transaction Hash: ${receipt?.hash}`);
  console.log(`Gas Used: ${receipt?.gasUsed.toString()}`);

  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const daiBalAfter = await DAI.balanceOf(AssetHolder);

  console.log("FINAL BALANCES:");
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalAfter, 6)}`);
  console.log(`DAI Balance: ${ethers.formatUnits(daiBalAfter, 18)}`);

  console.log("CHANGES:");
  console.log(`USDC Change: ${ethers.formatUnits(usdcBalAfter - usdcBalBefore, 6)}`);
  console.log(`DAI Change: ${ethers.formatUnits(daiBalAfter - daiBalBefore, 18)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

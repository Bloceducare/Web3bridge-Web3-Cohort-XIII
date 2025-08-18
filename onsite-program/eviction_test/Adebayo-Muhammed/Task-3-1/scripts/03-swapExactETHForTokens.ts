import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("UNISWAP V2 - SWAP EXACT ETH FOR TOKENS");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const ethBalBefore = await ethers.provider.getBalance(AssetHolder);
  const usdcBalBefore = await USDC.balanceOf(AssetHolder);

  console.log("INITIAL BALANCES:");
  console.log(`ETH Balance: ${ethers.formatEther(ethBalBefore)}`);
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalBefore, 6)}`);

  const ethAmount = ethers.parseEther("1.0");

  console.log(`Swapping ${ethers.formatEther(ethAmount)} ETH for USDC`);

  const path = [WETHAddress, USDCAddress];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const swapTx = await Router.connect(impersonatedSigner).swapExactETHForTokens(
    0,
    path,
    impersonatedSigner.address,
    deadline,
    { value: ethAmount }
  );

  const receipt = await swapTx.wait();
  console.log("Swap completed");
  console.log(`Transaction Hash: ${receipt?.hash}`);
  console.log(`Gas Used: ${receipt?.gasUsed.toString()}`);

  const ethBalAfter = await ethers.provider.getBalance(AssetHolder);
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);

  console.log("FINAL BALANCES:");
  console.log(`ETH Balance: ${ethers.formatEther(ethBalAfter)}`);
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalAfter, 6)}`);

  console.log("CHANGES:");
  console.log(`ETH Change: ${ethers.formatEther(ethBalAfter - ethBalBefore)}`);
  console.log(`USDC Change: ${ethers.formatUnits(usdcBalAfter - usdcBalBefore, 6)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

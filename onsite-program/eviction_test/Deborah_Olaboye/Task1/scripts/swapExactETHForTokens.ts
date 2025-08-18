import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // USDC contract Address
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  // WETH contract Address
  const WETH_Address = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  // Uniswap V2 Router Address
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const WETH = await ethers.getContractAt("IERC20", WETH_Address);

  const usdcBal = await USDC.balanceOf(AssetHolder);
  const ethBalance = await ethers.provider.getBalance(AssetHolder);

  console.log("################### Initial Balance Info ###########################");
  console.log("User Initial USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("User Initial ETH Balance:", ethers.formatEther(ethBalance));

  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  // Amount of ETH to swap
  const ETHAmount = ethers.parseEther("1");

  // No approval needed for ETH swaps
  console.log("ETH Amount to swap:", ethers.formatEther(ETHAmount));

  const path = [WETH_Address, USDCAddress];
  const to = AssetHolder;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Perform the swap
  const swapTx = await Router.connect(impersonatedSigner).swapExactETHForTokens(
    1,
    path,
    to,
    deadline,
    { value: ETHAmount }
  );
  const receipt = await swapTx.wait();
  console.log("Swap transaction receipt:");

  // Check balances after swap
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const ethBalanceAfter = await ethers.provider.getBalance(AssetHolder);

  console.log("################### Final Balance Info ###########################");
  console.log("User Final USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log("User Final ETH Balance:", ethers.formatEther(ethBalanceAfter));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
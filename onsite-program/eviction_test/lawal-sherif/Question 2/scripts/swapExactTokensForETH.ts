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
  console.log("Successfully impersonated. Signer address:", impersonatedSigner.address);

  console.log("Fetching contract instances...");
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);
  console.log("Contracts loaded successfully");

  const amountIn = ethers.parseUnits("10000", 6);
  const amountOutMin = ethers.parseUnits("3", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Preparing to swap USDC for ETH:");
  console.log("- USDC Amount In:", ethers.formatUnits(amountIn, 6));
  console.log("- Minimum ETH Expected:", ethers.formatUnits(amountOutMin, 18));
  console.log("- Deadline:", new Date(deadline * 1000).toLocaleString());
  console.log("- Path: [USDC -> WETH]");

  console.log("Approving Uniswap Router to spend USDC...");
  const approvalTx = await USDC.connect(impersonatedSigner).approve(UNIRouter, amountIn);
  await approvalTx.wait();
  console.log("Approval successful. Tx Hash:", approvalTx.hash);

  console.log("Executing swapExactTokensForETH...");
  const tx = await ROUTER.connect(impersonatedSigner).swapExactTokensForETH(
    amountIn,
    amountOutMin,
    [USDCAddress, wethAddress],
    impersonatedSigner.address,
    deadline
  );

  console.log("Transaction sent. Waiting for confirmation...");
  await tx.wait();

  console.log("swapExactTokensForETH executed successfully");
  console.log("Transaction Hash:", tx.hash);
};

main().catch((error) => {
  console.error("Error executing script:", error);
  process.exitCode = 1;
});

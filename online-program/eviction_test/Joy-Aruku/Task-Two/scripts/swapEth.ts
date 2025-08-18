import { ethers } from "hardhat";
import { ISwapRouter__factory } from "../typechain-types"; // Assuming this is generated; if not, use ABI below
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  // Define the token and router addresses (Uniswap V3 SwapRouter)
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // V3 router

  const daiHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; // This address holds ~80M DAI

  await helpers.impersonateAccount(daiHolder);
  const impersonatedSigner = await ethers.getSigner(daiHolder);
  console.log(`Impersonated account: ${impersonatedSigner.address}`);

  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const WETH = await ethers.getContractAt("IERC20", wethAddress);

  // Attach V3 SwapRouter interface (use factory if typechain; alternatively, inline ABI)
  const ROUTER = ISwapRouter__factory.connect(UNIRouter, impersonatedSigner);
  // If no typechain, use this instead:
  // const swapRouterABI = [
  //   "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
  // ];
  // const ROUTER = await ethers.getContractAt(swapRouterABI, UNIRouter);

  // Balances before swap
  const daiBalanceBefore = await DAI.balanceOf(impersonatedSigner.address);
  const wethBalanceBefore = await WETH.balanceOf(impersonatedSigner.address);

  console.log("DAI Balance Before:", ethers.formatUnits(daiBalanceBefore, 18));
  console.log("WETH Balance Before:", ethers.formatUnits(wethBalanceBefore, 18));

  // Amount to swap (use a small amount for testing; adjust as needed)
  const amountIn = ethers.parseUnits("1000", 18);

  // Approve DAI to the V3 router
  await DAI.connect(impersonatedSigner).approve(UNIRouter, amountIn);
  console.log("Approved DAI for swap");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

  // Perform the exactInputSingle swap (DAI -> WETH via 0.3% fee pool)
  const tx = await ROUTER.exactInputSingle({
    tokenIn: DAIAddress,
    tokenOut: wethAddress,
    fee: 3000, // 0.3% fee tier (common for DAI-WETH)
    recipient: impersonatedSigner.address,
    deadline: deadline,
    amountIn: amountIn,
    amountOutMinimum: 0, // Set to a slippage-tolerant value; in prod, calculate properly
    sqrtPriceLimitX96: 0 // No price limit
  });

  const receipt = await tx.wait();
  console.log("Swap executed at tx hash:", receipt?.hash);

  // Balances after swap
  const daiBalanceAfter = await DAI.balanceOf(impersonatedSigner.address);
  const wethBalanceAfter = await WETH.balanceOf(impersonatedSigner.address);

  console.log("DAI Balance After:", ethers.formatUnits(daiBalanceAfter, 18));
  console.log("WETH Balance After:", ethers.formatUnits(wethBalanceAfter, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});